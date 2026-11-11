
import { DIG_CSS } from './moves/dig';
import { FLY_CSS } from './moves/fly';
import { RAPID_SPIN_CSS } from './moves/rapidSpin';
import { SOLAR_BEAM_CSS } from './moves/solarBeam';
import { DIVE_CSS } from './moves/dive';
import { BOUNCE_CSS } from './moves/bounce';
import { BODY_SLAM_CSS } from './moves/bodySlam';
import { STOMP_CSS } from './moves/stomp';
import { MINIMIZE_CSS } from './moves/minimize';
import { SOUND_BURST_CSS } from './moves/soundBurst';
import { ROLLING_CSS } from './moves/rolling';
import { SEISMIC_CSS } from './moves/seismic';
import { PHANTOM_CSS } from './moves/phantom';
import { DAMAGE_CSS } from './general/damage';
import { PHYSICAL_ATTACK_CSS } from './general/physicalAttack';
import { SPECIAL_ATTACK_CSS } from './general/specialAttack';
import { getDynamicStatusStyles } from './statusRegistry';
import { ENTRY_CSS } from './transitions/entry';
import { EXIT_CSS } from './transitions/exit';
import { STAT_BOOST_CSS } from './general/statBoost';
import { STAT_DROP_CSS } from './general/statDrop';

export const getDynamicMoveStyles = () => {
  return `
    ${DIG_CSS}
    ${FLY_CSS}
    ${RAPID_SPIN_CSS}
    ${SOLAR_BEAM_CSS}
    ${DIVE_CSS}
    ${BOUNCE_CSS}
    ${BODY_SLAM_CSS}
    ${STOMP_CSS}
    ${MINIMIZE_CSS}
    ${SOUND_BURST_CSS}
    ${ROLLING_CSS}
    ${SEISMIC_CSS}
    ${PHANTOM_CSS}
    ${DAMAGE_CSS}
    ${PHYSICAL_ATTACK_CSS}
    ${SPECIAL_ATTACK_CSS}
    ${getDynamicStatusStyles()}
    ${ENTRY_CSS}
    ${EXIT_CSS}
    ${STAT_BOOST_CSS}
    ${STAT_DROP_CSS}
  `;
};
