/**
 * Health Metrics Utility for Farm Guardians
 *
 * Metrics considered:
 *  - Weight:           < 450 kg → underweight, > 900 kg → overweight
 *  - Body temperature: < 37.5°C or > 39.5°C → fever / hypothermia risk
 *  - Rumination (24h): < 5 h → poor digestive health indicator
 *  - Activity level:   < 20 units → low activity / lethargy risk
 *  - Milk yield:       < 5 L/session → low production alert
 *  - Heat score:       > 75 → in heat (reproductive alert)
 *  - Age (months):     < 12 months → calf – different thresholds apply
 */

export const THRESHOLDS = {
  UNDERWEIGHT_KG: 450,
  OVERWEIGHT_KG: 900,
  TEMP_LOW_C: 37.5,
  TEMP_HIGH_C: 39.5,
  RUMINATION_LOW_H: 5,
  ACTIVITY_LOW: 20,
  MILK_LOW_L: 5,
  HEAT_SCORE_HIGH: 75,
};

/**
 * Returns an array of warning objects for a given cattle + optional latest sensor reading.
 *
 * @param {object} cattle  - { weight, date_of_birth, status }
 * @param {object} reading - { body_temperature, rumination_hours_24h, activity_level,
 *                             milk_yield_liters, heat_score }  (all optional)
 * @returns {{ type: string, message: string, severity: 'critical'|'warning'|'info' }[]}
 */
export function evaluateMetrics(cattle = {}, reading = {}) {
  const warnings = [];

  const weight = parseFloat(cattle.weight);
  if (!isNaN(weight)) {
    if (weight < THRESHOLDS.UNDERWEIGHT_KG) {
      warnings.push({
        type: 'underweight',
        message: `Weight ${weight} kg is below the underweight threshold (${THRESHOLDS.UNDERWEIGHT_KG} kg). Check nutrition.`,
        severity: 'warning',
      });
    } else if (weight > THRESHOLDS.OVERWEIGHT_KG) {
      warnings.push({
        type: 'overweight',
        message: `Weight ${weight} kg exceeds the overweight threshold (${THRESHOLDS.OVERWEIGHT_KG} kg). Review diet.`,
        severity: 'warning',
      });
    }
  }

  const temp = parseFloat(reading.body_temperature);
  if (!isNaN(temp)) {
    if (temp > THRESHOLDS.TEMP_HIGH_C) {
      warnings.push({
        type: 'fever',
        message: `Temperature ${temp.toFixed(1)}°C is above normal (>${THRESHOLDS.TEMP_HIGH_C}°C). Possible fever.`,
        severity: 'critical',
      });
    } else if (temp < THRESHOLDS.TEMP_LOW_C) {
      warnings.push({
        type: 'hypothermia',
        message: `Temperature ${temp.toFixed(1)}°C is below normal (<${THRESHOLDS.TEMP_LOW_C}°C). Possible hypothermia.`,
        severity: 'critical',
      });
    }
  }

  const rumination = parseFloat(reading.rumination_hours_24h);
  if (!isNaN(rumination) && rumination < THRESHOLDS.RUMINATION_LOW_H) {
    warnings.push({
      type: 'low_rumination',
      message: `Rumination only ${rumination.toFixed(1)} h/day (normal ≥ ${THRESHOLDS.RUMINATION_LOW_H} h). Digestive concern.`,
      severity: 'warning',
    });
  }

  const activity = parseFloat(reading.activity_level);
  if (!isNaN(activity) && activity < THRESHOLDS.ACTIVITY_LOW) {
    warnings.push({
      type: 'low_activity',
      message: `Activity level ${activity} is low (<${THRESHOLDS.ACTIVITY_LOW}). Possible lethargy.`,
      severity: 'warning',
    });
  }

  const milk = parseFloat(reading.milk_yield_liters);
  if (!isNaN(milk) && milk < THRESHOLDS.MILK_LOW_L) {
    warnings.push({
      type: 'low_milk',
      message: `Milk yield ${milk.toFixed(1)} L is below expected (${THRESHOLDS.MILK_LOW_L} L/session).`,
      severity: 'info',
    });
  }

  const heatScore = parseFloat(reading.heat_score);
  if (!isNaN(heatScore) && heatScore > THRESHOLDS.HEAT_SCORE_HIGH) {
    warnings.push({
      type: 'in_heat',
      message: `Heat score ${heatScore.toFixed(0)}/100 indicates the cow is in heat. Consider AI.`,
      severity: 'info',
    });
  }

  return warnings;
}

/**
 * Returns an overall health label based on the list of warnings.
 * @param {{ severity: string }[]} warnings
 * @returns { 'critical' | 'warning' | 'healthy' }
 */
export function overallHealth(warnings = []) {
  if (warnings.some(w => w.severity === 'critical')) return 'critical';
  if (warnings.some(w => w.severity === 'warning')) return 'warning';
  return 'healthy';
}

/**
 * Derive a display status string from cattle data (weight-based).
 * @param {object} cattle
 * @returns {string}
 */
export function deriveStatus(cattle = {}) {
  const weight = parseFloat(cattle.weight);
  if (!isNaN(weight)) {
    if (weight < THRESHOLDS.UNDERWEIGHT_KG) return 'underweight';
    if (weight > THRESHOLDS.OVERWEIGHT_KG) return 'overweight';
  }
  return cattle.status || 'healthy';
}
