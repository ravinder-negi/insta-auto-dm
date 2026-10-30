import type { LeadMagnet, Product, Profile, ProfileLink, ProfileSocial } from "@/types";

/** Data a public-profile template renders — identical across all templates so
 *  the page only has to pick which one to mount. */
export interface ProfileTemplateProps {
  profile: Profile;
  links: ProfileLink[];
  socials: ProfileSocial[];
  leadMagnets: LeadMagnet[];
  products: Product[];
}
