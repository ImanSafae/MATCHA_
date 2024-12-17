import os

def find_missing_jpgs(folder_path):
    # Créer un ensemble contenant tous les noms de fichiers attendus (de 1.jpg à 500.jpg)
    expected_files = {f"{i}.jpg" for i in range(1, 501)}
    
    # Lister tous les fichiers dans le dossier
    actual_files = {f for f in os.listdir(folder_path) if f.endswith('.jpg')}
    
    # Trouver les fichiers manquants en faisant la différence entre l'ensemble attendu et l'ensemble trouvé
    missing_files = sorted(list(expected_files - actual_files))
    
    return missing_files

# Exemple d'utilisation
folder_path = '.'  # Remplacer par le chemin du dossier contenant les fichiers jpg
missing_jpgs = find_missing_jpgs(folder_path)

print("Fichiers manquants :", missing_jpgs)
