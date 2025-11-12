# -*- coding: utf-8 -*-
"""
Script pour générer le rapport de stage restructuré en 2 parties
"""

def generer_rapport():
    rapport = """

MINISTERE DE L'ECONOMIE NUMERIQUEREPUBLIQUE GABONAISE
Union – Travail – Justice


INSTITUT NATIONAL DE LA POSTE, DES TECHNOLOGIES DE L'INFORMATION ET DE LA COMMUNICATION


RAPPORT DE STAGE DE FIN DE FORMATION POUR L'OBTENTION DU
DIPLOME DE LICENCE PROFESSIONNELLE


THEME : Développement d'un système informatisé de facturation et de suivi de stock


OPTION : DÉVELOPPEMENT D'APPLICATIONS RÉPARTIES




Présenté et soutenu par :
OTSINA MINKO Jean Rodrigue Rismin


Sous la direction de :
M. ENGOANG DALADIER

Tuteur en entreprise :
M. SAMBA SONKO


Année Académique : 2024-2025

"""
    
    with open('rappo4_nouveau.txt', 'w', encoding='utf-8') as f:
        f.write(rapport)
    
    print("Fichier créé avec succès!")

if __name__ == "__main__":
    generer_rapport()
