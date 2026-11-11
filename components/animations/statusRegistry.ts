
import { POISON_CSS, getPoisonAnimation } from './status/poison';
import { BURN_CSS, getBurnAnimation } from './status/burn';
import { PARALYSIS_CSS, getParalysisAnimation } from './status/paralysis';
import { SLEEP_CSS, getSleepAnimation } from './status/sleep';
import { FREEZE_CSS, getFreezeAnimation } from './status/freeze';
import { CONFUSION_CSS, getConfusionAnimation } from './status/confusion';
import { INFATUATION_CSS, getInfatuationAnimation } from './status/infatuation';
import { FLINCH_CSS, getFlinchAnimation } from './status/flinch';

export const getDynamicStatusStyles = () => {
  return `
    ${POISON_CSS}
    ${BURN_CSS}
    ${PARALYSIS_CSS}
    ${SLEEP_CSS}
    ${FREEZE_CSS}
    ${CONFUSION_CSS}
    ${INFATUATION_CSS}
    ${FLINCH_CSS}
  `;
};

export const getStatusAnimation = (
    statusType: 'poison' | 'burn' | 'paralysis' | 'sleep' | 'freeze' | 'confusion' | 'infatuation' | 'flinch',
    isPlayer: boolean = false
) => {
  switch (statusType) {
    case 'poison': return getPoisonAnimation();
    case 'burn': return getBurnAnimation();
    case 'paralysis': return getParalysisAnimation();
    case 'sleep': return getSleepAnimation();
    case 'freeze': return getFreezeAnimation();
    case 'confusion': return getConfusionAnimation();
    case 'infatuation': return getInfatuationAnimation();
    case 'flinch': return getFlinchAnimation(isPlayer);
    default: return {};
  }
};
