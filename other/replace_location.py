import re

# Lien vers votre fichier fake.sql
file_path = 'fake.sql'

# Fonction pour remplacer les coordonnées géographiques par la fonction PostgreSQL ST_SetSRID
def replace_location_with_postgis(file_path):
    # Lire le contenu du fichier
    with open(file_path, 'r') as file:
        content = file.read()

    # Expression régulière pour détecter les coordonnées sous forme 'latitude,longitude'
    location_pattern = re.compile(r'\'(\d+\.\d+),(\-?\d+\.\d+)\'')

    # Fonction de remplacement
    def replace_location(match):
        latitude = match.group(1)
        longitude = match.group(2)
        return f"ST_SetSRID(ST_MakePoint({longitude}, {latitude}), 4326)"

    # Remplacer les coordonnées par la syntaxe PostgreSQL
    new_content = re.sub(location_pattern, replace_location, content)

    # Écrire le nouveau contenu dans un nouveau fichier ou remplacer l'existant
    new_file_path = 'updated_locations_fake.sql'
    with open(new_file_path, 'w') as new_file:
        new_file.write(new_content)
    
    print(f"Les localisations ont été remplacées par ST_SetSRID dans {new_file_path}")

# Appeler la fonction pour remplacer les localisations
replace_location_with_postgis(file_path)
