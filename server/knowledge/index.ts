import { STORAGE_DOMAIN_PROFILES_01, StoragePolicyProfile } from './storageDomain01';
import { STORAGE_DOMAIN_PROFILES_02 } from './storageDomain02';
import { STORAGE_DOMAIN_PROFILES_03 } from './storageDomain03';
import { STORAGE_DOMAIN_PROFILES_04 } from './storageDomain04';
import { STORAGE_DOMAIN_PROFILES_05 } from './storageDomain05';
import { STORAGE_DOMAIN_PROFILES_06 } from './storageDomain06';

export * from './storageDomain01';

export class StorageKnowledgeBase {
  private static allProfiles: StoragePolicyProfile[] = [
    ...STORAGE_DOMAIN_PROFILES_01,
    ...STORAGE_DOMAIN_PROFILES_02,
    ...STORAGE_DOMAIN_PROFILES_03,
    ...STORAGE_DOMAIN_PROFILES_04,
    ...STORAGE_DOMAIN_PROFILES_05,
    ...STORAGE_DOMAIN_PROFILES_06,
  ];

  public static getAllProfiles(): StoragePolicyProfile[] {
    return this.allProfiles;
  }

  public static getProfilesByIndustry(industry: string): StoragePolicyProfile[] {
    const q = industry.toLowerCase();
    return this.allProfiles.filter(p => p.industry.toLowerCase().includes(q));
  }

  public static getProfileById(id: string): StoragePolicyProfile | undefined {
    return this.allProfiles.find(p => p.id === id);
  }

  public static searchProfiles(query: string): StoragePolicyProfile[] {
    const q = query.toLowerCase();
    return this.allProfiles.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }
}
