export type ProfileLink = {
  label: string;
  href: string;
};

export type Education = {
  degree: string;
  school: string;
  detail: string;
};

export type Profile = {
  name: string;
  role: string;
  location: string;
  email: string;
  availability: string;
  summary: string;
  about: string[];
  points?: string[];
  education?: Education[];
  links: ProfileLink[];
};

export type ProjectSection = {
  label: string;
  items: string[];
};

export type ProjectShot = {
  src: string;
  title: string;
  text: string;
};

export type Project = {
  title: string;
  year: string;
  summary: string;
  tags: string[];
  features: string[];
  sections?: ProjectSection[];
  shots?: ProjectShot[];
  image?: string;
  href?: string;
};

export type SkillGroup = {
  label: string;
  detail?: string;
  items: string[];
};

export type PortfolioContent = {
  profile: Profile;
  projects: Project[];
  skills: SkillGroup[];
};
