/**
 * Mapeo de Marcas a Wikidata IDs para Entity Linking (Legendary SEO)
 * Esto le dice a Google exactamente a qué entidad del mundo real nos referimos.
 */
export const BRAND_ENTITIES: Record<string, string> = {
    'toyota': 'https://www.wikidata.org/wiki/Q14690',
    'ford': 'https://www.wikidata.org/wiki/Q44294',
    'chevrolet': 'https://www.wikidata.org/wiki/Q29570',
    'nissan': 'https://www.wikidata.org/wiki/Q20165',
    'honda': 'https://www.wikidata.org/wiki/Q9584',
    'volkswagen': 'https://www.wikidata.org/wiki/Q246',
    'bmw': 'https://www.wikidata.org/wiki/Q26678',
    'mercedes-benz': 'https://www.wikidata.org/wiki/Q36023',
    'audi': 'https://www.wikidata.org/wiki/Q23317',
    'mazda': 'https://www.wikidata.org/wiki/Q35996',
    'jeep': 'https://www.wikidata.org/wiki/Q30116',
    'dodge': 'https://www.wikidata.org/wiki/Q27187',
    'ram': 'https://www.wikidata.org/wiki/Q213031',
    'kia': 'https://www.wikidata.org/wiki/Q35339',
    'hyundai': 'https://www.wikidata.org/wiki/Q55931',
    'tesla': 'https://www.wikidata.org/wiki/Q478214',
    'gmc': 'https://www.wikidata.org/wiki/Q48028',
    'cadillac': 'https://www.wikidata.org/wiki/Q27436',
    'buick': 'https://www.wikidata.org/wiki/Q25164',
    'lexus': 'https://www.wikidata.org/wiki/Q35919',
    'porsche': 'https://www.wikidata.org/wiki/Q40993',
    'ferrari': 'https://www.wikidata.org/wiki/Q27586',
    'lamborghini': 'https://www.wikidata.org/wiki/Q35886',
    'land rover': 'https://www.wikidata.org/wiki/Q35891',
    'subaru': 'https://www.wikidata.org/wiki/Q52414',
    'mitsubishi': 'https://www.wikidata.org/wiki/Q183275',
}

export function getBrandEntity(brand: string): string | undefined {
    return BRAND_ENTITIES[brand.toLowerCase()]
}
