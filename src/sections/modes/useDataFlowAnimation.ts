import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type ComponentPublicInstance,
  type Ref,
} from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'

import type { Mode } from './modes.data'
import {
  BASE_R,
  FIRST_PAUSE_MAX,
  HEAD_OPACITY,
  PACKETS_START_DELAY,
  SCHEME_LINKS,
  TAIL,
  TRAIL_DRAW,
  TRAIL_DRAW_EASE,
  TRAIL_EASE,
  TRAIL_MELT,
  TRAIL_STEP,
  confirmLeds,
  distanceAlong,
  edgeFade,
  fadeShare,
  firstPacketAt,
  ledConfirmDelay,
  linksOfMode,
  nextPause,
  packetDirection,
  packetDuration,
  packetScale,
  trailMeltAt,
  type LedId,
} from './dataFlow'

/**
 * ЖИВАЯ СХЕМА ОБМЕНА ДАННЫМИ — движок анимации.
 *
 * Связи прочерчиваются, когда пользователь доходит до экрана.
 * Дальше по каждой связи идут одиночные «пакеты»: направление
 * выбирается случайно, но на одной линии одновременно живёт только
 * один пакет — встречных столкновений не бывает. Крупный пакет
 * движется медленнее мелкого, появляется и исчезает плавно, а узлы
 * на концах мигают диодом в момент отправки и приёма.
 *
 * Почему императивно, а не через реактивные атрибуты в шаблоне:
 * координаты и прозрачность пакетов меняются каждый кадр (60 раз в секунду
 * на 3–4 связях), а прочерчивание связей — это последовательность
 * CSS-переходов с принудительным reflow между шагами. Через реактивность
 * это был бы лишний патч виртуального DOM на каждый кадр и гонки с
 * переходами. Поэтому шаблон (DataFlowScheme.vue) только рисует элементы и
 * отдаёт их сюда через функции-рефы, а движок меняет их атрибуты напрямую.
 * Шаблон эти атрибуты не привязывает, так что Vue их не перезаписывает.
 *
 *   const { isLive, pathRefs, headRefs, tailRefs, ledRefs } =
 *     useDataFlowAnimation({ mode, active })
 */

/** Функция-реф для :ref="…" в шаблоне */
export type ElementRef = (el: Element | ComponentPublicInstance | null) => void

/** Состояние одной связи между кадрами */
interface LinkState {
  len: number
  /** доля пути на появление/угасание */
  fade: number
  busy: boolean
  /** когда выпускать следующий пакет (performance.now); 0 — ещё не назначено */
  next: number
  /** приёмник уже мигнул */
  arrived: boolean
  dir: 1 | -1
  scale: number
  dur: number
  t0: number
  /** таймеры прочерчивания этой связи (прошлый запуск мог оборваться на середине) */
  trailTimers: number[]
}

export function useDataFlowAnimation(options: {
  /** выбранный режим */
  mode: Ref<Mode>
  /** экран виден (≥ 35 %): первый показ запускает схему, уход — ставит на паузу */
  active: Ref<boolean>
}) {
  const reducedMotion = usePreferredReducedMotion()
  const reduced = computed(() => reducedMotion.value === 'reduce')

  /** Связи показаны. До этого CSS держит их прозрачными (.scheme:not(.is-live)). */
  const isLive = ref(false)

  /* ---- Элементы схемы: шаблон отдаёт их через функции-рефы ---- */
  const paths: (SVGPathElement | null)[] = SCHEME_LINKS.map(() => null)
  const heads: (SVGCircleElement | null)[] = SCHEME_LINKS.map(() => null)
  const tails: (SVGCircleElement | null)[][] = SCHEME_LINKS.map(() => TAIL.map(() => null))
  const leds: Partial<Record<LedId, SVGElement>> = {}

  const pathRefs: ElementRef[] = SCHEME_LINKS.map((_, i) => (el) => {
    paths[i] = el as SVGPathElement | null
  })
  const headRefs: ElementRef[] = SCHEME_LINKS.map((_, i) => (el) => {
    heads[i] = el as SVGCircleElement | null
  })
  const tailRefs: ElementRef[][] = SCHEME_LINKS.map((_, i) =>
    TAIL.map((_t, k) => (el) => {
      tails[i]![k] = el as SVGCircleElement | null
    }),
  )
  const ledRefs = {} as Record<LedId, ElementRef>
  for (const id of ['wexus', 'router', 'c0', 'c1', 'c2'] as const) {
    ledRefs[id] = (el) => {
      if (el) leds[id] = el as SVGElement
      else delete leds[id]
    }
  }

  /* ---- Состояние движка (только в браузере, заполняется в onMounted) ---- */
  let states: LinkState[] = []
  let activeMode: Mode = options.mode.value
  let started = false
  let running = false
  let rafId = 0
  let startTimer = 0
  /** таймеры вспышек диодов: в исходнике не отменялись, снимаем только при размонтировании */
  const ledTimers = new Set<number>()

  onMounted(() => {
    states = SCHEME_LINKS.map((_, i) => {
      const len = paths[i]?.getTotalLength() ?? 0
      return {
        len,
        fade: fadeShare(len),
        busy: false,
        next: 0,
        arrived: false,
        dir: 1,
        scale: 1,
        dur: 0,
        t0: 0,
        trailTimers: [],
      }
    })
  })

  /** Перезапуск вспышки диода: снять класс, форсировать reflow, поставить снова */
  function blink(el: SVGElement | undefined) {
    if (!el) return
    el.classList.remove('is-blink')
    void el.getBoundingClientRect()
    el.classList.add('is-blink')
  }

  function sender(i: number, s: LinkState) {
    const link = SCHEME_LINKS[i]!
    return leds[s.dir > 0 ? link.from : link.to]
  }
  function receiver(i: number, s: LinkState) {
    const link = SCHEME_LINKS[i]!
    return leds[s.dir > 0 ? link.to : link.from]
  }

  function spawn(i: number, s: LinkState, now: number) {
    s.busy = true
    s.arrived = false
    s.dir = packetDirection(Math.random()) /* в обе стороны */
    s.scale = packetScale(Math.random())
    heads[i]?.setAttribute('r', (BASE_R * s.scale).toFixed(2))
    TAIL.forEach((tail, k) => {
      tails[i]![k]?.setAttribute('r', (BASE_R * s.scale * tail.radius).toFixed(2))
    })
    s.dur = packetDuration(s.len, s.scale) /* крупнее — медленнее */
    s.t0 = now
    blink(sender(i, s)) /* узел отправил */
  }

  function idle(i: number, s: LinkState, now: number) {
    s.busy = false
    heads[i]?.style.setProperty('opacity', '0')
    tails[i]!.forEach((el) => el?.style.setProperty('opacity', '0'))
    s.next = now + nextPause(Math.random()) /* случайные паузы */
  }

  function moveTo(el: SVGCircleElement | null, i: number, dist: number) {
    const pt = paths[i]?.getPointAtLength(dist)
    if (!el || !pt) return
    el.setAttribute('cx', pt.x.toFixed(2))
    el.setAttribute('cy', pt.y.toFixed(2))
  }

  /** Один кадр: двигаем пакеты по всем связям текущего режима */
  function step(now: number) {
    states.forEach((s, i) => {
      if (SCHEME_LINKS[i]!.mode !== activeMode) {
        if (s.busy) idle(i, s, now)
        return
      }
      if (!s.busy) {
        if (s.next === 0) s.next = now + Math.random() * FIRST_PAUSE_MAX
        if (now >= s.next) spawn(i, s, now)
        return
      }
      const t = (now - s.t0) / s.dur
      if (t >= 1) {
        if (!s.arrived) blink(receiver(i, s))
        idle(i, s, now)
        return
      }
      moveTo(heads[i] ?? null, i, distanceAlong(t, s.dir, s.len))
      /* плавное появление у отправителя и угасание у получателя */
      const fade = edgeFade(t, s.fade)
      heads[i]?.style.setProperty('opacity', (HEAD_OPACITY * fade).toFixed(3))
      /* шлейф идёт следом с отставанием и гаснет быстрее головы */
      TAIL.forEach((tail, k) => {
        const el = tails[i]![k] ?? null
        const tt = t - tail.lag
        if (tt <= 0) {
          el?.style.setProperty('opacity', '0')
          return
        }
        moveTo(el, i, distanceAlong(tt, s.dir, s.len))
        const tf = edgeFade(tt, s.fade)
        el?.style.setProperty('opacity', (HEAD_OPACITY * fade * tf * tail.opacity).toFixed(3))
      })
      /* принимающий узел мигает ровно тогда, когда пакет начинает гаснуть */
      if (!s.arrived && t > 1 - s.fade) {
        blink(receiver(i, s))
        s.arrived = true
      }
    })
  }

  function loop(now: number) {
    if (!running) return
    step(now)
    rafId = requestAnimationFrame(loop)
  }
  function startLoop() {
    if (running) return
    running = true
    rafId = requestAnimationFrame(loop)
  }
  function stopLoop() {
    running = false
    cancelAnimationFrame(rafId)
  }

  function clearTrail(i: number, s: LinkState) {
    s.trailTimers.forEach(clearTimeout)
    s.trailTimers = []
    const path = paths[i]
    if (!path) return
    path.style.transition = ''
    path.style.strokeDasharray = ''
    path.style.strokeDashoffset = ''
  }

  function drawTrails(mode: Mode) {
    /* прошлый запуск мог оборваться на середине — снимаем его хвосты со всех связей */
    states.forEach((s, i) => clearTrail(i, s))
    linksOfMode(mode).forEach((link, i) => {
      const path = paths[link.index]
      const s = states[link.index]
      if (!path || !s) return
      const len = Math.ceil(path.getTotalLength())
      const melt = trailMeltAt(i)
      path.style.transition = 'none'
      path.style.opacity = '1'
      path.style.strokeDasharray = `${len} ${len}`
      path.style.strokeDashoffset = String(len)
      void path.getBoundingClientRect()
      path.style.transition = `stroke-dashoffset ${TRAIL_DRAW}ms ${TRAIL_DRAW_EASE} ${i * TRAIL_STEP}ms`
      path.style.strokeDashoffset = '0'
      s.trailTimers = [
        window.setTimeout(() => {
          /* «10 0» — тот же период, что в покое, и та же сплошная линия:
             подмена незаметна, зато дальше просветы растут от нуля на месте */
          path.style.transition = 'none'
          path.style.strokeDasharray = '10 0'
          void path.getBoundingClientRect()
          path.style.transition = `stroke-dasharray ${TRAIL_MELT}ms ${TRAIL_EASE}`
          path.style.strokeDasharray = '5 5'
        }, melt),
        window.setTimeout(
          () => {
            /* значение уже совпало с тем, что задано группой, — снимаем инлайн молча */
            path.style.transition = ''
            path.style.strokeDasharray = ''
            path.style.strokeDashoffset = ''
          },
          melt + TRAIL_MELT + 60,
        ),
      ]
      /* пакет не выезжает на связь, пока она не дорисована и не стала пунктиром */
      s.next = performance.now() + firstPacketAt(i, Math.random())
    })
    /* узлы по очереди подтверждают, что связь поднялась */
    confirmLeds(mode).forEach((id, i) => {
      const timer = window.setTimeout(() => {
        ledTimers.delete(timer)
        blink(leds[id])
      }, ledConfirmDelay(i))
      ledTimers.add(timer)
    })
  }

  /* Смена режима. Схема одна, меняется только состояние: узлы остаются
     на местах, поэтому видно, что это одно устройство, а не два продукта.
     flush: 'post' — прочерчивать можно только после того, как Vue поставил
     класс is-<режим> и группа нового режима стала видимой: у элемента с
     display:none CSS-переход не запускается, и связь появилась бы сразу целиком
     (в исходнике класс тоже менялся до запуска прочерчивания). */
  watch(
    options.mode,
    (mode) => {
      activeMode = mode
      const now = performance.now()
      states.forEach((s, i) => {
        s.next = 0
        if (s.busy) idle(i, s, now)
      })
      if (isLive.value && !reduced.value) drawTrails(mode)
    },
    { flush: 'post' },
  )

  /* первый показ: связи появляются только когда пользователь дошёл до экрана */
  watch(options.active, (visible) => {
    if (!visible) {
      stopLoop() /* за пределами экрана кадры не тратим */
      return
    }
    if (!started) {
      started = true
      isLive.value = true
      if (!reduced.value) {
        drawTrails(activeMode)
        startTimer = window.setTimeout(() => {
          // если за эти 700 мс экран уже ушёл, пакеты запустятся при возвращении
          if (options.active.value) startLoop()
        }, PACKETS_START_DELAY)
      }
    } else if (!reduced.value) {
      startLoop()
    }
  })

  onBeforeUnmount(() => {
    stopLoop()
    clearTimeout(startTimer)
    ledTimers.forEach(clearTimeout)
    states.forEach((s) => s.trailTimers.forEach(clearTimeout))
  })

  return { isLive, pathRefs, headRefs, tailRefs, ledRefs }
}
