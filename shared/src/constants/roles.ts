/**
 * User roles within a trip pack.
 */
export enum UserRole {
  LEADER = 'leader',
  SWEEPER = 'sweeper',
  NAVIGATOR = 'navigator',
  MEMBER = 'member',
}

/**
 * Display labels for each trip role.
 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.LEADER]: 'Pack Leader',
  [UserRole.SWEEPER]: 'Sweeper',
  [UserRole.NAVIGATOR]: 'Navigator',
  [UserRole.MEMBER]: 'Member',
};
