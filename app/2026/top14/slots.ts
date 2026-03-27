export const POSITIONS = [
  "lib_arriere",
  "lib_34aile",
  "lib_34centre",
  "lib_34centre",
  "lib_34aile",
  "lib_ouverture",
  "lib_12melee",
  "lib_3emeligne",
  "lib_3emeligne",
  "lib_3emeligne",
  "lib_2emeligne",
  "lib_2emeligne",
  "lib_pilier",
  "lib_talonneur",
  "lib_pilier",
];

export const assignPlayerToSlot = ({
  slots,
  player,
  slotIndex,
}: {
  slots: (any | null)[];
  player: any;
  slotIndex?: number;
}): (any | null)[] => {
  if (slotIndex !== undefined) {
    const newSlots = [...slots];
    newSlots[slotIndex] = player;
    return newSlots;
  }
  const idx = POSITIONS.findIndex(
    (pos, i) => pos === player.position && !slots[i],
  );
  if (idx !== -1) {
    const newSlots = [...slots];
    newSlots[idx] = player;
    return newSlots;
  }
  const emptyIdx = slots.slice(0, 15).findIndex((s) => !s);
  if (emptyIdx !== -1) {
    const newSlots = [...slots];
    newSlots[emptyIdx] = player;
    return newSlots;
  }
  return slots;
};
