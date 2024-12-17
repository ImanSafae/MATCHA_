import re
import random

# Lien vers votre fichier fake.sql
file_path = 'fake.sql'

# Fonction pour modifier les valeurs après la localisation
def modify_after_location(file_path):
    # Lire le contenu du fichier
    with open(file_path, 'r') as file:
        content = file.read()

    # Expression régulière pour trouver les coordonnées ST_SetSRID
    location_pattern = re.compile(r'(ST_SetSRID\(ST_MakePoint\(\-?\d+\.\d+, \-?\d+\.\d+\), 4326\))[^)]*')

    # Fonction de remplacement qui ajoute une valeur aléatoire entre 1 et 5 après la localisation
    def replace_after_location(match):
        random_value = random.randint(1, 5)
        return f"{match.group(1)}, {random_value})"

    # Remplacer tout ce qui suit la localisation par une valeur aléatoire
    new_content = re.sub(location_pattern, replace_after_location, content)

    # Écrire le nouveau contenu dans un nouveau fichier
    new_file_path = 'updated_values_fake.sql'
    with open(new_file_path, 'w') as new_file:
        new_file.write(new_content)
    
    print(f"Toutes les valeurs après la localisation ont été supprimées et remplacées par une valeur aléatoire dans {new_file_path}")

# Appeler la fonction pour modifier les valeurs
modify_after_location(file_path)
