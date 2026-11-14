// Text that the ASCII layer only shows under the cursor's light.
// Lightly scrambled so it does not sit in the bundle as a readable string.
const DATA = [60, 13, 9, 8, 13, 17, 237, 236, 250, 237, 255, 213, 203, 195, 217, 162, 166, 162, 135, 171, 142, 136, 171, 151, 99, 112, 117, 101, 99];

export const hiddenNote = () => DATA.map((c, i) => String.fromCharCode(c ^ ((0x5a + i * 7) & 0xff))).join('');
