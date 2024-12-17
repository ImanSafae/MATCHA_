import re
from datetime import datetime, timedelta

# Lien vers votre fichier fake.sql
file_path = 'fake.sql'

# Fonction pour convertir l'âge en date de naissance
def age_to_birthdate(age):
    current_year = 2024  # L'année de référence
    birth_year = current_year - age
    # Retourne la date de naissance en format 'YYYY-MM-DD'
    return f'{birth_year}-07-06'  # On choisit une date par défaut, ici le 6 juillet

# Remplacer les âges par des dates de naissance
def replace_ages_with_birthdates(file_path):
    # Lire le contenu du fichier
    with open(file_path, 'r') as file:
        content = file.read()

    # Expression régulière pour détecter les âges (colonnes age, suivies d'un nombre)
    age_pattern = re.compile(r'(\d+), \'(man|woman)\'')

    # Fonction de remplacement
    def replace_age(match):
        age = int(match.group(1))
        birthdate = age_to_birthdate(age)
        return f"'{birthdate}', '{match.group(2)}'"

    # Remplacer les âges par les dates de naissance
    new_content = re.sub(age_pattern, replace_age, content)

    # Écrire le nouveau contenu dans un nouveau fichier ou remplacer l'existant
    new_file_path = 'updated_fake.sql'
    with open(new_file_path, 'w') as new_file:
        new_file.write(new_content)
    
    print(f"Les âges ont été remplacés par des dates de naissance dans {new_file_path}")

# Appeler la fonction pour remplacer les âges
replace_ages_with_birthdates(file_path)
