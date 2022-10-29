const {
  relativeLuminance,
  hexToRGBA,
  RGBAToHSLA,
} = require('canvas-sketch-util/color')
const { pick, shuffle } = require('canvas-sketch-util/random')

/**
 * Initialize a palette using the provided color library
 * @param {{id: string, hex: string}[]} data Array of colour swatch objects
 * @param {boolean} log Toggle error logging
 */
module.exports = function (data, log = true) {
  // Calculate additional data points for each swatch
  const swatches = data.map((swatch) => {
    const rgba = hexToRGBA(swatch.hex)
    return {
      ...swatch,
      rgba,
      hsla: RGBAToHSLA(rgba),
      luminance: relativeLuminance(swatch.hex),
    }
  })

  // Range helpers
  const mod = (n, m) => ((n % m) + m) % m
  const between = (val, min, max) => val >= min && val <= max
  const polarBetween = (val, theta, range) =>
    Math.abs(mod(val - theta, 360) - range) <= range

  // Filter out excluded items
  const trim = (list, exclude = []) =>
    list.filter((s) => {
      for (let i = 0; i < exclude.length; i++) {
        if (
          s.id === (typeof exclude[i] === 'string' ? exclude[i] : exclude[i].id)
        ) {
          return false
        }
      }
      return true
    })

  // Handle invalid output
  const invalidate = (n, list) => {
    const ERROR_SWATCH = {
      id: 'invalid',
      title: 'Invalid Swatch',
      hex: '#ff0000',
      contrast: true,
    }
    return n > 1
      ? [...list, ...Array(n).fill(ERROR_SWATCH)].slice(0, n)
      : ERROR_SWATCH
  }

  // Handle randomization
  const output = (list, n) => {
    if (n > 1) {
      return shuffle(list).slice(0, n)
    }
    return pick(list)
  }

  /**
   * Swatch by ID
   * @param {string} id Swatch ID
   * @returns Swatch object
   */
  const id = (id) => {
    const swatch = swatches.find((s) => s.id === id)
    if (!swatch) {
      log && console.error(`Could not find swatch with id "${id}"`)
      return invalidate()
    }
    return swatch
  }

  /**
   * Random swatch(es)
   * @param {number} n Number of swatches to fetch
   * @param {Array} exclude ID strings or objects of any swatches to exclude from results
   * @returns randomized swatch or array of swatches
   */
  const random = (n = 1, exclude = []) => {
    return output(trim(swatches, exclude), n)
  }

  /**
   * Random swatch(es) by luminance
   * @param {number} min Minimum luminance
   * @param {number} max Maximum luminance
   * @param {number} n Number of swatches to fetch
   * @param {Array} exclude ID strings or objects of any swatches to exclude from results
   * @returns randomized swatch or array of swatches
   */
  const luminance = (min = 0, max = 1, n = 1, exclude = []) => {
    const pool = trim(swatches, exclude).filter((s) =>
      between(s.luminance, min, max)
    )
    if (pool.length < n) {
      log &&
        console.error(
          `Could not find ${
            n > 1 ? `${n} swatches` : 'swatch'
          } with luminance between ${min} and ${max}.`
        )
      return invalidate(n, pool)
    }

    return output(pool, n)
  }

  /**
   * Random swatch(es) by hue
   * @param {number} theta Degrees around hue wheel (0 = red, 120 = green, 240 = blue)
   * @param {number} range Degrees in either direction to include
   * @param {number} n Number of swatches to fetch
   * @param {Array} exclude ID strings or objects of any swatches to exclude from results
   * @returns randomized swatch or array of swatches
   */
  const hue = (theta = 0, range = 45, n = 1, exclude = []) => {
    const pool = trim(swatches, exclude).filter((s) =>
      polarBetween(s.hsla[0], theta, range)
    )

    if (pool.length < n) {
      log &&
        console.error(
          `Could not find ${
            n > 1 ? `${n} swatches` : 'swatch'
          } within hue range ${theta}±${range}.`
        )
      return invalidate(n, pool)
    }

    return output(pool, n)
  }

  /**
   * Random swatch(es) by saturation
   * @param {number} min Minimum saturation
   * @param {number} max Maximum saturation
   * @param {number} n Number of swatches to fetch
   * @param {Array} exclude ID strings or objects of any swatches to exclude from results
   * @returns randomized swatch or array of swatches
   */
  const saturation = (min = 0, max = 1, n = 1, exclude = []) => {
    const pool = trim(swatches, exclude).filter((s) =>
      between(s.hsla[1] / 100, min, max)
    )
    if (pool.length < n) {
      log &&
        console.error(
          `Could not find ${
            n > 1 ? `${n} swatches` : 'swatch'
          } with saturation between ${min} and ${max}.`
        )
      return invalidate(n, pool)
    }

    return output(pool, n)
  }

  /**
   * Random swatch(es) by lightness
   * @param {number} min Minimum lightness
   * @param {number} max Maximum lightness
   * @param {number} n Number of swatches to fetch
   * @param {Array} exclude ID strings or objects of any swatches to exclude from results
   * @returns randomized swatch or array of swatches
   */
  const lightness = (min = 0, max = 1, n = 1, exclude = []) => {
    const pool = trim(swatches, exclude).filter((s) =>
      between(s.hsla[2] / 100, min, max)
    )
    if (pool.length < n) {
      log &&
        console.error(
          `Could not find ${
            n > 1 ? `${n} swatches` : 'swatch'
          } with lightness between ${min} and ${max}.`
        )
      return invalidate(n, pool)
    }

    return output(pool, n)
  }

  /**
   * Random swatch(es) by HSL ranges
   * @param {number[]} hue Degrees around hue wheel, and degrees in either direction to include
   * @param {number[]} saturation Min and max saturation
   * @param {number[]} lightness Min and max lightness
   * @param {number} n Number of swatches to fetch
   * @param {Array} exclude ID strings or objects of any swatches to exclude from results
   * @returns randomized swatch or array of swatches
   */
  const hsl = (
    hue = [0, 180],
    saturation = [0, 1],
    lightness = [0, 1],
    n = 1,
    exclude = []
  ) => {
    const pool = trim(swatches, exclude).filter(
      (s) =>
        polarBetween(s.hsla[0], hue[0], hue[1]) &&
        between(s.hsla[1] / 100, saturation[0], saturation[1]) &&
        between(s.hsla[2] / 100, lightness[0], lightness[1])
    )
    if (pool.length < n) {
      log &&
        console.error(
          `Could not find ${
            n > 1 ? `${n} swatches` : 'swatch'
          } within HSL ranges (${hue[0]}±${hue[1]}, ${saturation[0]}-${
            saturation[1]
          }, ${lightness[0]}-${lightness[1]}).`
        )
      return invalidate(n, pool)
    }

    return output(pool, n)
  }

  return {
    swatches,
    id,
    random,
    luminance,
    hue,
    saturation,
    lightness,
    hsl,
  }
}
