
import { GROUP_A_C } from './abilities_data/group_a_c';
import { GROUP_D_F } from './abilities_data/group_d_f';
import { GROUP_G_I } from './abilities_data/group_g_i';
import { GROUP_J_M } from './abilities_data/group_j_m';
import { GROUP_N_P } from './abilities_data/group_n_p';
import { GROUP_Q_R } from './abilities_data/group_q_r';
import { GROUP_S_V } from './abilities_data/group_s_v';
import { GROUP_W_Z } from './abilities_data/group_w_z';

export const ABILITY_EFFECTS: Record<string, any> = {
  ...GROUP_A_C,
  ...GROUP_D_F,
  ...GROUP_G_I,
  ...GROUP_J_M,
  ...GROUP_N_P,
  ...GROUP_Q_R,
  ...GROUP_S_V,
  ...GROUP_W_Z
};
