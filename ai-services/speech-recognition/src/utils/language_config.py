"""
Language Configuration
AI-Powered eLearning Platform - Quartermasters FZC

Configuration for all 70+ FSI languages with linguistic metadata
"""

from typing import Dict, Any, Optional

# Comprehensive FSI Language Database
FSI_LANGUAGES: Dict[str, Dict[str, Any]] = {
    # Category I Languages (22-24 weeks, 575-600 hours)
    'af': {
        'name': 'Afrikaans',
        'native_name': 'Afrikaans',
        'fsi_category': 1,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': False,
        'family': 'indo_european',
        'subfamily': 'germanic',
        'countries': ['ZA'],
        'speakers': 7000000,
        'difficulty_notes': 'Similar to English and Dutch'
    },
    'da': {
        'name': 'Danish',
        'native_name': 'Dansk',
        'fsi_category': 1,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': False,
        'family': 'indo_european',
        'subfamily': 'germanic',
        'countries': ['DK'],
        'speakers': 6000000,
        'difficulty_notes': 'Germanic language with straightforward grammar'
    },
    'nl': {
        'name': 'Dutch',
        'native_name': 'Nederlands',
        'fsi_category': 1,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': False,
        'family': 'indo_european',
        'subfamily': 'germanic',
        'countries': ['NL', 'BE'],
        'speakers': 24000000,
        'difficulty_notes': 'Close to English, regular spelling'
    },
    'fr': {
        'name': 'French',
        'native_name': 'Français',
        'fsi_category': 1,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': False,
        'family': 'indo_european',
        'subfamily': 'romance',
        'countries': ['FR', 'CA', 'BE', 'CH', 'LU'],
        'speakers': 280000000,
        'difficulty_notes': 'Romance language with familiar vocabulary'
    },
    'it': {
        'name': 'Italian',
        'native_name': 'Italiano',
        'fsi_category': 1,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': False,
        'family': 'indo_european',
        'subfamily': 'romance',
        'countries': ['IT', 'SM', 'VA'],
        'speakers': 65000000,
        'difficulty_notes': 'Phonetic spelling, regular pronunciation'
    },
    'no': {
        'name': 'Norwegian',
        'native_name': 'Norsk',
        'fsi_category': 1,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': False,
        'family': 'indo_european',
        'subfamily': 'germanic',
        'countries': ['NO'],
        'speakers': 5000000,
        'difficulty_notes': 'Similar to English word order'
    },
    'pt': {
        'name': 'Portuguese',
        'native_name': 'Português',
        'fsi_category': 1,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': False,
        'family': 'indo_european',
        'subfamily': 'romance',
        'countries': ['PT', 'BR', 'AO', 'MZ'],
        'speakers': 260000000,
        'difficulty_notes': 'Romance language with complex verb system'
    },
    'ro': {
        'name': 'Romanian',
        'native_name': 'Română',
        'fsi_category': 1,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': True,
        'family': 'indo_european',
        'subfamily': 'romance',
        'countries': ['RO', 'MD'],
        'speakers': 24000000,
        'difficulty_notes': 'Latin-based with case system'
    },
    'es': {
        'name': 'Spanish',
        'native_name': 'Español',
        'fsi_category': 1,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': False,
        'family': 'indo_european',
        'subfamily': 'romance',
        'countries': ['ES', 'MX', 'AR', 'CO', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'GQ'],
        'speakers': 500000000,
        'difficulty_notes': 'Phonetic spelling, regular pronunciation rules'
    },
    'sv': {
        'name': 'Swedish',
        'native_name': 'Svenska',
        'fsi_category': 1,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': False,
        'family': 'indo_european',
        'subfamily': 'germanic',
        'countries': ['SE', 'FI'],
        'speakers': 10000000,
        'difficulty_notes': 'Germanic language with pitch accent'
    },

    # Category II Languages (30 weeks, 750 hours)
    'de': {
        'name': 'German',
        'native_name': 'Deutsch',
        'fsi_category': 2,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': True,
        'family': 'indo_european',
        'subfamily': 'germanic',
        'countries': ['DE', 'AT', 'CH', 'LI', 'LU'],
        'speakers': 100000000,
        'difficulty_notes': 'Complex case system and word order'
    },
    'ht': {
        'name': 'Haitian Creole',
        'native_name': 'Kreyòl Ayisyen',
        'fsi_category': 2,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': False,
        'family': 'creole',
        'subfamily': 'french_based',
        'countries': ['HT'],
        'speakers': 12000000,
        'difficulty_notes': 'French-based creole with simplified grammar'
    },
    'id': {
        'name': 'Indonesian',
        'native_name': 'Bahasa Indonesia',
        'fsi_category': 2,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': False,
        'family': 'austronesian',
        'subfamily': 'malayo_polynesian',
        'countries': ['ID'],
        'speakers': 270000000,
        'difficulty_notes': 'No verb conjugation, straightforward grammar'
    },
    'ms': {
        'name': 'Malay',
        'native_name': 'Bahasa Melayu',
        'fsi_category': 2,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': False,
        'family': 'austronesian',
        'subfamily': 'malayo_polynesian',
        'countries': ['MY', 'BN', 'SG'],
        'speakers': 290000000,
        'difficulty_notes': 'Similar to Indonesian, agglutinative'
    },
    'sw': {
        'name': 'Swahili',
        'native_name': 'Kiswahili',
        'fsi_category': 2,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': False,
        'family': 'niger_congo',
        'subfamily': 'bantu',
        'countries': ['TZ', 'KE', 'UG', 'RW', 'BI', 'CD'],
        'speakers': 200000000,
        'difficulty_notes': 'Bantu language with regular phonetic spelling'
    },

    # Category III Languages (36 weeks, 900 hours)
    'am': {
        'name': 'Amharic',
        'native_name': 'አማርኛ',
        'fsi_category': 3,
        'script_type': 'ethiopic',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': False,
        'family': 'afro_asiatic',
        'subfamily': 'semitic',
        'countries': ['ET'],
        'speakers': 57000000,
        'difficulty_notes': 'Semitic language with unique script'
    },
    'bn': {
        'name': 'Bengali',
        'native_name': 'বাংলা',
        'fsi_category': 3,
        'script_type': 'bengali',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': True,
        'family': 'indo_european',
        'subfamily': 'indo_aryan',
        'countries': ['BD', 'IN'],
        'speakers': 300000000,
        'difficulty_notes': 'Indo-Aryan with distinctive script'
    },
    'my': {
        'name': 'Burmese',
        'native_name': 'မြန်မာစာ',
        'fsi_category': 3,
        'script_type': 'myanmar',
        'writing_direction': 'ltr',
        'is_tonal': True,
        'has_cases': False,
        'family': 'sino_tibetan',
        'subfamily': 'tibeto_burman',
        'countries': ['MM'],
        'speakers': 33000000,
        'difficulty_notes': 'Tonal language with circular script'
    },
    'hr': {
        'name': 'Croatian',
        'native_name': 'Hrvatski',
        'fsi_category': 3,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': True,
        'family': 'indo_european',
        'subfamily': 'slavic',
        'countries': ['HR', 'BA'],
        'speakers': 5600000,
        'difficulty_notes': 'Slavic language with complex case system'
    },
    'cs': {
        'name': 'Czech',
        'native_name': 'Čeština',
        'fsi_category': 3,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': True,
        'family': 'indo_european',
        'subfamily': 'slavic',
        'countries': ['CZ'],
        'speakers': 10700000,
        'difficulty_notes': 'West Slavic with seven cases'
    },
    'fi': {
        'name': 'Finnish',
        'native_name': 'Suomi',
        'fsi_category': 3,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': True,
        'family': 'uralic',
        'subfamily': 'finnic',
        'countries': ['FI'],
        'speakers': 5500000,
        'difficulty_notes': 'Uralic language with 15 cases'
    },
    'he': {
        'name': 'Hebrew',
        'native_name': 'עברית',
        'fsi_category': 3,
        'script_type': 'hebrew',
        'writing_direction': 'rtl',
        'is_tonal': False,
        'has_cases': False,
        'family': 'afro_asiatic',
        'subfamily': 'semitic',
        'countries': ['IL'],
        'speakers': 9000000,
        'difficulty_notes': 'Semitic language written right-to-left'
    },
    'hi': {
        'name': 'Hindi',
        'native_name': 'हिन्दी',
        'fsi_category': 3,
        'script_type': 'devanagari',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': True,
        'family': 'indo_european',
        'subfamily': 'indo_aryan',
        'countries': ['IN'],
        'speakers': 600000000,
        'difficulty_notes': 'Indo-Aryan with complex verb system'
    },
    'hu': {
        'name': 'Hungarian',
        'native_name': 'Magyar',
        'fsi_category': 3,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': True,
        'family': 'uralic',
        'subfamily': 'ugric',
        'countries': ['HU'],
        'speakers': 13000000,
        'difficulty_notes': 'Uralic language with 18-35 cases'
    },
    'is': {
        'name': 'Icelandic',
        'native_name': 'Íslenska',
        'fsi_category': 3,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': True,
        'family': 'indo_european',
        'subfamily': 'germanic',
        'countries': ['IS'],
        'speakers': 330000,
        'difficulty_notes': 'Conservative Germanic language'
    },
    'kk': {
        'name': 'Kazakh',
        'native_name': 'Қазақ тілі',
        'fsi_category': 3,
        'script_type': 'cyrillic',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': True,
        'family': 'turkic',
        'subfamily': 'kipchak',
        'countries': ['KZ'],
        'speakers': 13000000,
        'difficulty_notes': 'Turkic language with vowel harmony'
    },
    'lo': {
        'name': 'Lao',
        'native_name': 'ພາສາລາວ',
        'fsi_category': 3,
        'script_type': 'lao',
        'writing_direction': 'ltr',
        'is_tonal': True,
        'has_cases': False,
        'family': 'tai_kadai',
        'subfamily': 'tai',
        'countries': ['LA'],
        'speakers': 7000000,
        'difficulty_notes': 'Tonal language with unique script'
    },
    'lv': {
        'name': 'Latvian',
        'native_name': 'Latviešu',
        'fsi_category': 3,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': True,
        'family': 'indo_european',
        'subfamily': 'baltic',
        'countries': ['LV'],
        'speakers': 1750000,
        'difficulty_notes': 'Baltic language with complex declensions'
    },
    'lt': {
        'name': 'Lithuanian',
        'native_name': 'Lietuvių',
        'fsi_category': 3,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': True,
        'family': 'indo_european',
        'subfamily': 'baltic',
        'countries': ['LT'],
        'speakers': 3000000,
        'difficulty_notes': 'Conservative Indo-European language'
    },
    'ne': {
        'name': 'Nepali',
        'native_name': 'नेपाली',
        'fsi_category': 3,
        'script_type': 'devanagari',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': True,
        'family': 'indo_european',
        'subfamily': 'indo_aryan',
        'countries': ['NP'],
        'speakers': 16000000,
        'difficulty_notes': 'Indo-Aryan with complex honorific system'
    },
    'fa': {
        'name': 'Persian',
        'native_name': 'فارسی',
        'fsi_category': 3,
        'script_type': 'arabic',
        'writing_direction': 'rtl',
        'is_tonal': False,
        'has_cases': False,
        'family': 'indo_european',
        'subfamily': 'iranian',
        'countries': ['IR', 'AF', 'TJ'],
        'speakers': 110000000,
        'difficulty_notes': 'Indo-European written in Arabic script'
    },
    'pl': {
        'name': 'Polish',
        'native_name': 'Polski',
        'fsi_category': 3,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': True,
        'family': 'indo_european',
        'subfamily': 'slavic',
        'countries': ['PL'],
        'speakers': 45000000,
        'difficulty_notes': 'West Slavic with complex phonology'
    },
    'ru': {
        'name': 'Russian',
        'native_name': 'Русский',
        'fsi_category': 3,
        'script_type': 'cyrillic',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': True,
        'family': 'indo_european',
        'subfamily': 'slavic',
        'countries': ['RU', 'BY', 'KZ', 'KG'],
        'speakers': 260000000,
        'difficulty_notes': 'East Slavic with six cases and complex aspect system'
    },
    'sr': {
        'name': 'Serbian',
        'native_name': 'Српски',
        'fsi_category': 3,
        'script_type': 'cyrillic',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': True,
        'family': 'indo_european',
        'subfamily': 'slavic',
        'countries': ['RS', 'BA', 'ME'],
        'speakers': 12000000,
        'difficulty_notes': 'South Slavic with pitch accent'
    },
    'sk': {
        'name': 'Slovak',
        'native_name': 'Slovenčina',
        'fsi_category': 3,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': True,
        'family': 'indo_european',
        'subfamily': 'slavic',
        'countries': ['SK'],
        'speakers': 5200000,
        'difficulty_notes': 'West Slavic similar to Czech'
    },
    'sl': {
        'name': 'Slovenian',
        'native_name': 'Slovenščina',
        'fsi_category': 3,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': True,
        'family': 'indo_european',
        'subfamily': 'slavic',
        'countries': ['SI'],
        'speakers': 2500000,
        'difficulty_notes': 'South Slavic with dual number'
    },
    'tl': {
        'name': 'Tagalog',
        'native_name': 'Tagalog',
        'fsi_category': 3,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': False,
        'family': 'austronesian',
        'subfamily': 'malayo_polynesian',
        'countries': ['PH'],
        'speakers': 45000000,
        'difficulty_notes': 'Austronesian with complex verbal system'
    },
    'th': {
        'name': 'Thai',
        'native_name': 'ไทย',
        'fsi_category': 3,
        'script_type': 'thai',
        'writing_direction': 'ltr',
        'is_tonal': True,
        'has_cases': False,
        'family': 'tai_kadai',
        'subfamily': 'tai',
        'countries': ['TH'],
        'speakers': 69000000,
        'difficulty_notes': 'Tonal language with no spaces between words'
    },
    'tr': {
        'name': 'Turkish',
        'native_name': 'Türkçe',
        'fsi_category': 3,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': True,
        'family': 'turkic',
        'subfamily': 'oghuz',
        'countries': ['TR'],
        'speakers': 88000000,
        'difficulty_notes': 'Agglutinative with vowel harmony'
    },
    'uk': {
        'name': 'Ukrainian',
        'native_name': 'Українська',
        'fsi_category': 3,
        'script_type': 'cyrillic',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': True,
        'family': 'indo_european',
        'subfamily': 'slavic',
        'countries': ['UA'],
        'speakers': 40000000,
        'difficulty_notes': 'East Slavic with complex phonological alternations'
    },
    'ur': {
        'name': 'Urdu',
        'native_name': 'اردو',
        'fsi_category': 3,
        'script_type': 'arabic',
        'writing_direction': 'rtl',
        'is_tonal': False,
        'has_cases': True,
        'family': 'indo_european',
        'subfamily': 'indo_aryan',
        'countries': ['PK', 'IN'],
        'speakers': 230000000,
        'difficulty_notes': 'Indo-Aryan written in Arabic script'
    },
    'uz': {
        'name': 'Uzbek',
        'native_name': 'Oʻzbek',
        'fsi_category': 3,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': False,
        'family': 'turkic',
        'subfamily': 'karluk',
        'countries': ['UZ'],
        'speakers': 44000000,
        'difficulty_notes': 'Turkic language with vowel harmony'
    },
    'vi': {
        'name': 'Vietnamese',
        'native_name': 'Tiếng Việt',
        'fsi_category': 3,
        'script_type': 'latin',
        'writing_direction': 'ltr',
        'is_tonal': True,
        'has_cases': False,
        'family': 'austro_asiatic',
        'subfamily': 'vietic',
        'countries': ['VN'],
        'speakers': 85000000,
        'difficulty_notes': 'Tonal language with complex tone system'
    },

    # Category IV Languages (44 weeks, 1100 hours)
    'ar': {
        'name': 'Arabic',
        'native_name': 'العربية',
        'fsi_category': 4,
        'script_type': 'arabic',
        'writing_direction': 'rtl',
        'is_tonal': False,
        'has_cases': True,
        'family': 'afro_asiatic',
        'subfamily': 'semitic',
        'countries': ['SA', 'EG', 'AE', 'JO', 'LB', 'SY', 'IQ', 'MA', 'DZ', 'TN', 'LY', 'SD', 'YE', 'OM', 'QA', 'BH', 'KW'],
        'speakers': 422000000,
        'difficulty_notes': 'Semitic language with trilateral root system'
    },
    'zh-CN': {
        'name': 'Chinese (Mandarin)',
        'native_name': '中文',
        'fsi_category': 4,
        'script_type': 'chinese',
        'writing_direction': 'ltr',
        'is_tonal': True,
        'has_cases': False,
        'family': 'sino_tibetan',
        'subfamily': 'sinitic',
        'countries': ['CN', 'TW', 'SG'],
        'speakers': 918000000,
        'difficulty_notes': 'Tonal language with logographic writing system'
    },
    'ja': {
        'name': 'Japanese',
        'native_name': '日本語',
        'fsi_category': 4,
        'script_type': 'japanese',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': False,
        'family': 'japonic',
        'subfamily': 'japanese',
        'countries': ['JP'],
        'speakers': 125000000,
        'difficulty_notes': 'Complex writing system with three scripts'
    },
    'ko': {
        'name': 'Korean',
        'native_name': '한국어',
        'fsi_category': 4,
        'script_type': 'korean',
        'writing_direction': 'ltr',
        'is_tonal': False,
        'has_cases': True,
        'family': 'koreanic',
        'subfamily': 'korean',
        'countries': ['KR', 'KP'],
        'speakers': 82000000,
        'difficulty_notes': 'Complex honorific system and agglutination'
    },

    # Category V Languages (88 weeks, 2200 hours)
    'zh-yue': {
        'name': 'Cantonese',
        'native_name': '廣東話',
        'fsi_category': 5,
        'script_type': 'chinese',
        'writing_direction': 'ltr',
        'is_tonal': True,
        'has_cases': False,
        'family': 'sino_tibetan',
        'subfamily': 'sinitic',
        'countries': ['HK', 'MO'],
        'speakers': 62000000,
        'difficulty_notes': 'Nine-tone Sinitic language'
    }
}


def get_language_config(language_code: str) -> Optional[Dict[str, Any]]:
    """Get configuration for a specific language"""
    return FSI_LANGUAGES.get(language_code)


def get_languages_by_family(family: str) -> Dict[str, Dict[str, Any]]:
    """Get all languages belonging to a language family"""
    return {
        code: config for code, config in FSI_LANGUAGES.items()
        if config.get('family') == family
    }


def get_languages_by_script(script_type: str) -> Dict[str, Dict[str, Any]]:
    """Get all languages using a specific script"""
    return {
        code: config for code, config in FSI_LANGUAGES.items()
        if config.get('script_type') == script_type
    }


def get_languages_by_category(fsi_category: int) -> Dict[str, Dict[str, Any]]:
    """Get all languages in a specific FSI difficulty category"""
    return {
        code: config for code, config in FSI_LANGUAGES.items()
        if config.get('fsi_category') == fsi_category
    }


def get_tonal_languages() -> Dict[str, Dict[str, Any]]:
    """Get all tonal languages"""
    return {
        code: config for code, config in FSI_LANGUAGES.items()
        if config.get('is_tonal', False)
    }


def get_rtl_languages() -> Dict[str, Dict[str, Any]]:
    """Get all right-to-left languages"""
    return {
        code: config for code, config in FSI_LANGUAGES.items()
        if config.get('writing_direction') == 'rtl'
    }


def get_case_languages() -> Dict[str, Dict[str, Any]]:
    """Get all languages with grammatical cases"""
    return {
        code: config for code, config in FSI_LANGUAGES.items()
        if config.get('has_cases', False)
    }


def is_supported_language(language_code: str) -> bool:
    """Check if a language is supported"""
    return language_code in FSI_LANGUAGES


def get_supported_language_codes() -> List[str]:
    """Get list of all supported language codes"""
    return list(FSI_LANGUAGES.keys())


def get_language_difficulty_hours(language_code: str) -> Optional[int]:
    """Get estimated learning hours for a language"""
    config = get_language_config(language_code)
    if not config:
        return None
    
    category = config.get('fsi_category', 1)
    
    # FSI hour estimates
    hour_mapping = {
        1: 600,    # 22-24 weeks
        2: 750,    # 30 weeks
        3: 900,    # 36 weeks
        4: 1100,   # 44 weeks
        5: 2200    # 88 weeks
    }
    
    return hour_mapping.get(category, 600)


def get_phonetic_inventory(language_code: str) -> Dict[str, Any]:
    """Get phonetic inventory for a language (simplified)"""
    # This would contain detailed phonetic information
    # For now, returning basic information
    config = get_language_config(language_code)
    if not config:
        return {}
    
    # Simplified phonetic features based on language family
    family = config.get('family', 'unknown')
    
    phonetic_features = {
        'indo_european': {
            'consonants': 20,
            'vowels': 5,
            'has_aspirated': False,
            'has_ejectives': False,
            'has_clicks': False
        },
        'sino_tibetan': {
            'consonants': 22,
            'vowels': 6,
            'has_aspirated': True,
            'has_ejectives': False,
            'has_clicks': False,
            'tones': 4 if config.get('is_tonal') else 0
        },
        'afro_asiatic': {
            'consonants': 28,
            'vowels': 3,
            'has_aspirated': False,
            'has_ejectives': True,
            'has_clicks': False,
            'has_pharyngeals': True
        },
        'tai_kadai': {
            'consonants': 21,
            'vowels': 9,
            'has_aspirated': True,
            'has_ejectives': False,
            'has_clicks': False,
            'tones': 5 if config.get('is_tonal') else 0
        }
    }
    
    return phonetic_features.get(family, phonetic_features['indo_european'])


def get_cultural_context(language_code: str) -> Dict[str, Any]:
    """Get cultural context information for a language"""
    config = get_language_config(language_code)
    if not config:
        return {}
    
    # Basic cultural information
    return {
        'countries': config.get('countries', []),
        'speakers': config.get('speakers', 0),
        'formality_levels': _get_formality_levels(language_code),
        'honorific_system': _has_honorific_system(language_code),
        'gesture_sensitivity': _get_gesture_sensitivity(language_code),
        'cultural_notes': config.get('difficulty_notes', '')
    }


def _get_formality_levels(language_code: str) -> List[str]:
    """Get formality levels for a language"""
    # Languages with complex formality systems
    complex_formality = ['ja', 'ko', 'th', 'vi', 'hi', 'ur', 'tr']
    
    if language_code in complex_formality:
        return ['very_formal', 'formal', 'neutral', 'informal', 'casual']
    else:
        return ['formal', 'neutral', 'informal']


def _has_honorific_system(language_code: str) -> bool:
    """Check if language has complex honorific system"""
    honorific_languages = ['ja', 'ko', 'th', 'vi', 'hi', 'ur', 'bn', 'ne']
    return language_code in honorific_languages


def _get_gesture_sensitivity(language_code: str) -> str:
    """Get gesture sensitivity level for cultural context"""
    # This is a simplified classification
    high_gesture = ['it', 'es', 'ar', 'tr']
    low_gesture = ['ja', 'ko', 'fi', 'th']
    
    if language_code in high_gesture:
        return 'high'
    elif language_code in low_gesture:
        return 'low'
    else:
        return 'medium'