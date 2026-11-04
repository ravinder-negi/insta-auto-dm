import type { Product, Profile, ProfileLink, ProfileSocial, PublicLeadMagnet } from "@/types";

/** Data a public-profile template renders — identical across all templates so
 *  the page only has to pick which one to mount. */
export interface ProfileTemplateProps {
  profile: Profile;
  links: ProfileLink[];
  socials: ProfileSocial[];
  leadMagnets: PublicLeadMagnet[];
  products: Product[];
}
