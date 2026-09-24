import { describe, expect, it } from 'vitest'
import {
  FADE_MAX,
  SCHEME_LINKS,
  TRAIL_MELT,
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
  pathStart,
  trailMeltAt,
} from '../dataFlow'
import { MODES, panelId, tabId } from '../modes.data'

describe('связи схемы', () => {
  it('в домашней сети 4 связи, без интернета — 3', () => {
    expect(linksOfMode('local')).toHaveLength(4)
    expect(linksOfMode('solo')).toHaveLength(3)
  })

  it('номер связи совпадает с её местом в SCHEME_LINKS', () => {
    for (const link of [...linksOfMode('local'), ...linksOfMode('solo')]) {
      expect(SCHEME_LINKS[link.index]?.d).toBe(link.d)
    }
  })

  it('начальная точка берётся из команды M', () => {
    expect(pathStart('M 225 172 C 254 168, 262 118, 273 82')).toEqual({ x: 225, y: 172 })
    expect(() => pathStart('C 1 2')).toThrow('Путь должен начинаться с M x y')
  })

  it('диоды подтверждения — как в исходнике', () => {
    expect(confirmLeds('local')).toEqual(['wexus', 'router'])
    expect(confirmLeds('solo')).toEqual(['wexus'])
  })
})

describe('пакеты', () => {
  it('зона появления: не больше 30 % короткой связи и 26 единиц длинной', () => {
    expect(fadeShare(50)).toBe(FADE_MAX)
    expect(fadeShare(260)).toBeCloseTo(0.1)
  })

  it('масштаб 1…2.5, крупнее — медленнее', () => {
    expect(packetScale(0)).toBe(1)
    expect(packetScale(1)).toBe(2.5)
    expect(packetDuration(92, 1)).toBe(1000)
    expect(packetDuration(92, 2)).toBe(2000)
  })

  it('паузы 500…3900 мс, направление в обе стороны', () => {
    expect(nextPause(0)).toBe(500)
    expect(nextPause(1)).toBe(3900)
    expect(packetDirection(0.2)).toBe(1)
    expect(packetDirection(0.7)).toBe(-1)
  })

  it('расстояние по пути учитывает направление', () => {
    expect(distanceAlong(0.25, 1, 100)).toBe(25)
    expect(distanceAlong(0.25, -1, 100)).toBe(75)
  })

  it('появление и угасание по краям, полная яркость в середине', () => {
    expect(edgeFade(0, 0.2)).toBe(0)
    expect(edgeFade(0.1, 0.2)).toBeCloseTo(0.5)
    expect(edgeFade(0.5, 0.2)).toBe(1)
    expect(edgeFade(0.95, 0.2)).toBeCloseTo(0.25)
  })
})

describe('прочерчивание', () => {
  it('связи распадаются по очереди, а первый пакет выходит после распада своей связи', () => {
    for (let i = 0; i < 4; i++) {
      expect(trailMeltAt(i + 1)).toBeGreaterThan(trailMeltAt(i))
      expect(firstPacketAt(i, 0)).toBeGreaterThan(trailMeltAt(i) + TRAIL_MELT)
      expect(firstPacketAt(i, 1)).toBeGreaterThan(firstPacketAt(i, 0))
    }
  })

  it('диоды подтверждают подключение по очереди', () => {
    expect(ledConfirmDelay(1)).toBeGreaterThan(ledConfirmDelay(0))
  })
})

describe('вкладки', () => {
  it('id вкладок и панелей как в исходнике', () => {
    expect(MODES.map((m) => [tabId(m.id), panelId(m.id)])).toEqual([
      ['tab-solo', 'panel-solo'],
      ['tab-local', 'panel-local'],
    ])
  })
})
