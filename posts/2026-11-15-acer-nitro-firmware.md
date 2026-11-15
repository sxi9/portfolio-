---
title: Sixteen gigabytes installed, six usable: asking the firmware why
date: 2026-11-15
kind: write-up
summary: An Acer Nitro 5 that reported 6 GB of its 16. Proving the cap was the firmware's decision, getting 2 GB back, and the three other things that broke on the way.
tags: [firmware, uefi, hardware, linux]
figure: chip
---

The laptop is an Acer Nitro 5 AN515-43: a Ryzen 5 3550H on Insyde H2O firmware, dual-booting Windows 11 and Arch. It has two 8 GB memory modules. Both operating systems reported about 6 GB usable and listed the rest as "hardware reserved".

## The OS, or the firmware?

The two modules do not match. One is a generic DDR4-2667, the other a Micron DDR4-3200. That made the firmware the suspect, but a suspicion is not a finding. Three independent sources, none of which an operating system controls, said the same thing.

1. **The kernel's e820 map**, which is the memory map the firmware hands over at boot. Usable RAM ends at one address, a reserved tail follows, and nothing is mapped above about 10.5 GB. Roughly 5.5 GB of the second module never appears in the address space at all.
2. **SMBIOS type 17.** Both modules are detected, 8 GB each, trained to 2400 MT/s. It is not a dead stick: the firmware sees both.
3. **The UEFI shell's `memmap`.** Total memory: 8,021 MB. The firmware does not see 16 GB and withhold half. It only ever counts about one module.

So this is a decision made during memory initialisation. No kernel parameter can map memory that the firmware never mapped.

## What did not work

- **Writing the AMD setup variable from Linux.** The writes persisted and the firmware ignored them. A value that survives a reboot is not the same as a value that is honoured. On this board a change only takes when it goes through the firmware's own setup engine.
- **`memmap=` kernel parameters.** The region could not be decoded, and the machine hung.
- **Turning memory interleaving off.** Applied, no change.
- **Setting the memory clock by hand.** Three beeps and no POST. The firmware recovered on its own after the failed boots.

## What did

Smokeless_UMAF opens the hidden AMD menus through the firmware's real setup engine. Setting the integrated GPU's frame buffer to 128 MB handed back memory it had been reserving, and usable RAM went from 5.7 GB to 7.6 GB.

The other 8 GB cannot be recovered in software. It needs a matched pair of modules, or a single 16 GB one.

## Three things that broke on the way

**The logo hang.** Cold boots sometimes stalled on the Acer logo until I entered the BIOS and restarted. Fast Boot was on. It reuses a saved memory-training result instead of training again, and that is unreliable with a mismatched pair. Entering the BIOS forced a full retrain, which is why the next boot worked. Disabling Fast Boot fixed it properly. Loosening the command timing did not, which pointed at the training path rather than the timing margin.

**Arch booting to a black screen.** The display manager's service link pointed at a broken `sddm-plymouth` unit, so no desktop started. The GPU driver was fine all along. Repointing the link to plain `sddm` and clearing stale parameters out of GRUB fixed it.

**Windows refusing to boot with `0xc0000001`.** There were no minidumps and no startup-repair log, which means Windows never reached its kernel. That makes it a boot-loader failure, not a driver crash, and the graphics stop codes seen earlier were a red herring from a different state. Comparing files found the cause: the boot manager on the EFI partition was a newer build than the OS loader it was trying to start. Rebuilding the boot files with `bcdboot` from a WinPE environment fixed it and kept every profile and application.

One trap is worth passing on. Checking for "missing" Windows drivers from Linux gave false alarms, because the NTFS mount was case-sensitive.

## What I could not change

The firmware can show a custom boot logo. The option exists, but its menu row is suppressed, and the variable that holds it is write-protected from the operating system and from the UEFI shell. The only way around is a vendor tool that writes through a management-mode channel. Running an unsigned firmware tool from a modding forum, for a cosmetic change, was not worth the risk. The Acer logo stays.

## What is in the repository

- The findings, with the evidence for each.
- A curated guide to the hidden menus, with safety flags and known-good values.
- A reference of all 3,361 settings, decoded from the firmware's own form data, and the script that produced it.
- A script that patches one byte in a saved EFI variable and fixes its checksum.

A short list of rules came out of it too. Never touch the DRAM timing menu. Leave the controller enables and the boot and security settings alone. Keep a way to reset CMOS within reach.

It is on [GitHub](https://github.com/sxi9/acer-bios). Everything in it is specific to this model: offsets and variable names differ on other machines.
