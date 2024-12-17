import re

# Lien vers le fichier fake.sql
file_path = 'fake.sql'

# Fonction pour générer les insertions dans la table `picture`
def generate_picture_insertions(file_path):
    # Lire le fichier
    with open(file_path, 'r') as file:
        content = file.read()

    # Expression régulière pour capturer les `username` dans les insertions SQL
    username_pattern = re.compile(r"\('.*?', '(.*?)', '.*?', '.*?',")  # Capture le `username`

    # Trouver tous les `username` dans le fichier
    usernames = username_pattern.findall(content)

    # Générer l'insertion SQL pour chaque `username`
    picture_insertions = "INSERT INTO picture (user_id, pict_type, path)\nVALUES\n"
    for idx, username in enumerate(usernames, start=1):
        picture_insertions += f"((SELECT id FROM users WHERE username = '{username}'), 'PROFILE', 'http://localhost:3000/uploads/{idx}.jpg'),\n"

    # Remplacer la dernière virgule par un point-virgule
    picture_insertions = picture_insertions.rstrip(',\n') + ';\n'

    # Afficher ou écrire le résultat dans un fichier
    print(picture_insertions)
    new_file_path = 'picture_insertions.sql'
    with open(new_file_path, 'w') as new_file:
        new_file.write(picture_insertions)

    print(f"Insertion SQL pour `picture` générée dans {new_file_path}")

# Appeler la fonction pour générer les insertions
generate_picture_insertions(file_path)
