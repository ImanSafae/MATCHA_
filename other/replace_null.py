import re

# Liste des fichiers .jpg manquants
missing_images = ['105.jpg', '109.jpg', '111.jpg', '115.jpg', '116.jpg', '128.jpg', '129.jpg', '139.jpg', 
                  '152.jpg', '159.jpg', '161.jpg', '163.jpg', '167.jpg', '171.jpg', '172.jpg', '182.jpg', 
                  '183.jpg', '194.jpg', '195.jpg', '198.jpg', '205.jpg', '206.jpg', '208.jpg', '209.jpg', 
                  '210.jpg', '213.jpg', '214.jpg', '217.jpg', '218.jpg', '219.jpg', '221.jpg', '222.jpg', 
                  '223.jpg', '226.jpg', '228.jpg', '230.jpg', '231.jpg', '232.jpg', '236.jpg', '237.jpg', 
                  '239.jpg', '240.jpg', '241.jpg', '246.jpg', '247.jpg', '253.jpg', '254.jpg', '255.jpg', 
                  '257.jpg', '258.jpg', '260.jpg', '263.jpg', '265.jpg', '266.jpg', '268.jpg', '269.jpg', 
                  '271.jpg', '274.jpg', '279.jpg', '282.jpg', '283.jpg', '287.jpg', '289.jpg', '292.jpg', 
                  '293.jpg', '294.jpg', '295.jpg', '299.jpg', '304.jpg', '308.jpg', '309.jpg', '311.jpg', 
                  '314.jpg', '315.jpg', '317.jpg', '318.jpg', '319.jpg', '322.jpg', '328.jpg', '329.jpg', 
                  '330.jpg', '334.jpg', '335.jpg', '340.jpg', '341.jpg', '343.jpg', '344.jpg', '347.jpg', 
                  '350.jpg', '354.jpg', '357.jpg', '361.jpg', '362.jpg', '365.jpg', '367.jpg', '368.jpg', 
                  '369.jpg', '370.jpg', '371.jpg', '372.jpg', '373.jpg', '376.jpg', '379.jpg', '380.jpg', 
                  '381.jpg', '384.jpg', '388.jpg', '389.jpg', '391.jpg', '393.jpg', '394.jpg', '395.jpg', 
                  '396.jpg', '398.jpg', '402.jpg', '406.jpg', '410.jpg', '411.jpg', '412.jpg', '417.jpg', 
                  '418.jpg', '421.jpg', '423.jpg', '425.jpg', '427.jpg', '430.jpg', '431.jpg', '432.jpg', 
                  '437.jpg', '438.jpg', '440.jpg', '443.jpg', '444.jpg', '446.jpg', '447.jpg', '448.jpg', 
                  '451.jpg', '452.jpg', '454.jpg', '455.jpg', '457.jpg', '458.jpg', '459.jpg', '463.jpg', 
                  '465.jpg', '468.jpg', '469.jpg', '471.jpg', '472.jpg', '473.jpg', '474.jpg', '477.jpg', 
                  '478.jpg', '479.jpg', '481.jpg', '482.jpg', '483.jpg', '484.jpg', '485.jpg', '486.jpg', 
                  '488.jpg', '489.jpg', '490.jpg', '491.jpg', '495.jpg', '497.jpg', '499.jpg', '500.jpg', 
                  '53.jpg', '56.jpg', '63.jpg', '86.jpg', '97.jpg']

# Lien vers le fichier fake.sql
file_path = 'fake.sql'

def remove_lines_with_missing_images(file_path, missing_images):
    # Lire le contenu du fichier
    with open(file_path, 'r') as file:
        lines = file.readlines()

    # Créer un motif regex pour chaque image manquante et supprimer la ligne contenant cette image
    filtered_lines = []
    for line in lines:
        if not any(f"http://localhost:3000/uploads/{image}" in line for image in missing_images):
            filtered_lines.append(line)

    # Écrire les lignes filtrées dans un nouveau fichier ou remplacer l'existant
    new_file_path = 'updated_fake.sql'
    with open(new_file_path, 'w') as new_file:
        new_file.writelines(filtered_lines)

    print(f"Le fichier mis à jour a été enregistré sous {new_file_path}")

# Exécution de la fonction
remove_lines_with_missing_images(file_path, missing_images)
