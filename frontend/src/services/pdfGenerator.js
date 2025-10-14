/**
 * Générateur de PDF pour les factures (IDENTIQUE à Python reports/facture_pdf.py)
 * Utilise jsPDF et jspdf-autotable
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Formate un montant en FCFA (AVEC devise pour le tableau)
 * Comme Python ligne 109-113
 */
const formatCurrency = (value, currency = 'FCFA') => {
    const integer = Math.round(value);
    // Format français avec espaces comme séparateurs de milliers
    const formatted = integer.toLocaleString('fr-FR').replace(/\s/g, ' ');
    return `${formatted} ${currency}`;
};

/**
 * Formate un montant avec devise (pour les totaux - VERSION COMPACTE)
 */
const formatCurrencyFull = (value, currency = 'FCFA') => {
    const integer = Math.round(value);
    // Format sans espaces pour économiser de la place
    return `${integer}${currency}`;
};

/**
 * Convertit un nombre en lettres (français)
 */
const numberToFrench = (n) => {
    if (n === 0) return 'zéro';
    
    const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
    
    const convertBelow100 = (num) => {
        if (num < 10) return units[num];
        if (num < 20) return teens[num - 10];
        
        const unit = num % 10;
        const ten = Math.floor(num / 10);
        
        if (ten === 7 || ten === 9) {
            const base = tens[ten];
            const remainder = num - (ten * 10);
            if (remainder < 10) return base + '-' + units[remainder];
            return base + '-' + teens[remainder - 10];
        }
        
        if (unit === 0) return tens[ten] + (ten === 8 ? 's' : '');
        if (unit === 1 && ten <= 6) return tens[ten] + ' et un';
        return tens[ten] + '-' + units[unit];
    };
    
    const convertBelow1000 = (num) => {
        if (num < 100) return convertBelow100(num);
        
        const hundreds = Math.floor(num / 100);
        const remainder = num % 100;
        
        let result = '';
        if (hundreds === 1) result = 'cent';
        else result = units[hundreds] + ' cent';
        
        if (hundreds > 1 && remainder === 0) result += 's';
        if (remainder > 0) result += ' ' + convertBelow100(remainder);
        
        return result;
    };
    
    if (n < 1000) return convertBelow1000(n);
    
    const millions = Math.floor(n / 1000000);
    const thousands = Math.floor((n % 1000000) / 1000);
    const remainder = n % 1000;
    
    let result = '';
    
    if (millions > 0) {
        result += (millions === 1 ? 'un million' : convertBelow1000(millions) + ' millions');
    }
    
    if (thousands > 0) {
        if (result) result += ' ';
        result += (thousands === 1 ? 'mille' : convertBelow1000(thousands) + ' mille');
    }
    
    if (remainder > 0) {
        if (result) result += ' ';
        result += convertBelow1000(remainder);
    }
    
    return result;
};

/**
 * Génère le PDF d'une facture (IDENTIQUE au Python)
 * Structure : comme Python ligne 539-642
 */
export const generateFacturePDF = async (facture, lignes, client, entreprise) => {
    try {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 16; // 16mm comme Python
        let currentY = 10; // 10mm comme Python

        // ========== 1. LOGO / ESPACE (comme Python ligne 210-237) ==========
        // Afficher le logo si disponible
        if (entreprise.logo_path && entreprise.logo_path.trim() !== '') {
            try {
                console.log('📷 Ajout du logo au PDF:', entreprise.logo_path.substring(0, 50) + '...');
                const logoWidth = 60; // 60mm (augmenté de 40mm)
                const logoHeight = 25; // 25mm (augmenté de 15mm)
                const logoX = (pageWidth - logoWidth) / 2; // Centré
                
                // Détecter le format de l'image depuis le data URL
                let format = 'PNG';
                if (entreprise.logo_path.includes('data:image/jpeg') || entreprise.logo_path.includes('data:image/jpg')) {
                    format = 'JPEG';
                } else if (entreprise.logo_path.includes('data:image/png')) {
                    format = 'PNG';
                }
                
                doc.addImage(entreprise.logo_path, format, logoX, currentY, logoWidth, logoHeight);
                currentY += logoHeight + 2; // Hauteur du logo + petit espace
                console.log('✅ Logo ajouté avec succès');
            } catch (error) {
                console.error('❌ Erreur ajout logo:', error);
                currentY += 20; // Espace par défaut si erreur (augmenté aussi)
            }
        } else {
            console.log('⚠️ Pas de logo configuré');
            currentY += 20; // Espace pour logo (augmenté de 15mm à 20mm)
        }

        // ========== 2. TAGLINE (comme Python ligne 238-243) ==========
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.setFont('helvetica', 'normal');
        const tagline = "Ingénierie Informatique – Maintenance Informatique – Câblage réseaux Informatiques et Électrique – Interconnexions – Électronique et Domotique – Courants Forts et faibles – Contrôles d'Accès – Vidéosurveillance – Formation";
        
        // Diviser le tagline en lignes
        const splitTagline = doc.splitTextToSize(tagline, pageWidth - 2 * margin);
        splitTagline.forEach(line => {
            doc.text(line, pageWidth / 2, currentY, { align: 'center' });
            currentY += 3;
        });

        // Ligne horizontale (comme Python ligne 244)
        currentY += 2;
        doc.setDrawColor(211, 211, 211); // lightgrey
        doc.setLineWidth(0.6);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 5;

        // ========== 3. DATE (comme Python ligne 247-249) ==========
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const dateStr = facture.date_facture 
            ? new Date(facture.date_facture).toLocaleDateString('fr-FR')
            : new Date().toLocaleDateString('fr-FR');
        // Extraire la ville depuis l'adresse (premier mot avant la virgule)
        const ville = entreprise.adresse ? entreprise.adresse.split(',')[0].trim() : 'Douala';
        doc.text(`${ville}, le ${dateStr}`, pageWidth - margin, currentY, { align: 'right' });
        currentY += 8;

        // ========== 4. INFO BOX (comme Python ligne 301-332) ==========
        // Tableau : FACTURE N°, DEVIS N°, CLIENT, NIF, TELEPHONE
        const infoData = [
            ['FACTURE N°', facture.numero_facture || 'N/A'],
            ['DEVIS N°', facture.devis_numero || 'N/A'],
            ['CLIENT', client?.nom || 'Client'],
            ['NIF', client?.nif || ''],
            ['TELEPHONE', client?.telephone || '']
        ];

        autoTable(doc, {
            startY: currentY,
            body: infoData,
            theme: 'plain',
            columnStyles: {
                0: { 
                    cellWidth: 28, 
                    fillColor: [144, 238, 144], // Vert clair
                    textColor: [0, 0, 0],
                    fontStyle: 'bold'
                },
                1: { 
                    cellWidth: 70,
                    textColor: [0, 0, 0]
                }
            },
            styles: {
                fontSize: 8,
                cellPadding: 2,
                lineColor: [128, 128, 128],
                lineWidth: 0.6
            },
            tableWidth: 'auto',
            margin: { left: margin }
        });

        currentY = doc.lastAutoTable.finalY + 10;

        // ========== 5. SECTION BANNER (comme Python ligne 335-352) ==========
        const bannerText = facture.description && facture.description.trim() 
            ? facture.description.toUpperCase() 
            : 'DÉTAIL DE LA FACTURE';

        autoTable(doc, {
            startY: currentY,
            body: [[bannerText]],
            theme: 'plain',
            styles: {
                fillColor: [34, 139, 34], // Vert foncé
                textColor: [255, 255, 255],
                halign: 'center',
                fontSize: 10,
                fontStyle: 'bold',
                cellPadding: 3
            },
            tableWidth: 185,
            margin: { left: margin }
        });

        currentY = doc.lastAutoTable.finalY + 10;

        // ========== 6. TABLEAU DES ARTICLES (comme Python ligne 355-387) ==========
        // 4 colonnes : Désignation, Quantité, Prix Unitaire, Montant Total
        const tableData = lignes.map(ligne => [
            ligne.designation || ligne.article_nom || 'Article',
            String(ligne.quantite || 1), // Convertir en string
            formatCurrency(ligne.prix_unitaire || 0),
            formatCurrency(ligne.montant_ht || ligne.total_ht || 0)
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Désignation', 'Quantité', 'Prix Unitaire', 'Montant Total']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [34, 139, 34], // Vert foncé
                textColor: [255, 255, 255], // Blanc
                fontStyle: 'bold',
                fontSize: 9, // Comme Python ligne 382
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 9, // Comme Python ligne 383
                textColor: [0, 0, 0],
                cellPadding: 3 // Padding normal
            },
            columnStyles: {
                0: { cellWidth: 75, halign: 'left' },
                1: { cellWidth: 18, halign: 'right' },
                2: { cellWidth: 33, halign: 'right' },
                3: { cellWidth: 33, halign: 'right' }
            },
            styles: {
                lineColor: [211, 211, 211],
                lineWidth: 0.25,
                cellPadding: 2,
                overflow: 'linebreak',
                halign: 'left'
            },
            margin: { left: margin, right: margin }
        });

        currentY = doc.lastAutoTable.finalY + 12;

        // ========== 7. TOTAUX (comme Python ligne 389-455) ==========
        // Utiliser les totaux de la facture directement (pas recalculer depuis lignes)
        const totalHT = facture.total_ht || facture.montant_ht || 0;
        const totalTTC = facture.total_ttc || facture.montant_ttc || 0;
        const precompte = totalHT - totalTTC;
        const montantPaye = facture.montant_avance || 0;
        const resteAPayer = Math.max(0, totalTTC - montantPaye);

        // Déterminer si on affiche le précompte (comme Python ligne 417-440)
        const applyPrecompte = precompte > 0;
        const totauxData = [];

        if (applyPrecompte) {
            totauxData.push(['Total HT', formatCurrencyFull(totalHT)]);
            totauxData.push(['Précompte 9.5%', formatCurrencyFull(precompte)]);
            totauxData.push(['Net à payer', formatCurrencyFull(totalTTC)]);
            totauxData.push(['Montant payé', formatCurrencyFull(montantPaye)]);
            if (resteAPayer > 0) {
                totauxData.push(['Reste à payer', formatCurrencyFull(resteAPayer)]);
            }
        } else {
            totauxData.push(['Total', formatCurrencyFull(totalTTC)]);
            totauxData.push(['Net à payer', formatCurrencyFull(totalTTC)]);
            totauxData.push(['Montant payé', formatCurrencyFull(montantPaye)]);
            if (resteAPayer > 0) {
                totauxData.push(['Reste à payer', formatCurrencyFull(resteAPayer)]);
            }
        }

        // Tableau des totaux aligné à droite (comme Python ligne 442-454)
        const totalTableWidth = 95; // Agrandi : 50mm + 45mm
        autoTable(doc, {
            startY: currentY,
            body: totauxData,
            theme: 'grid',
            columnStyles: {
                0: { 
                    cellWidth: 50, // Agrandi de 45 à 50mm
                    fillColor: [144, 238, 144], // Vert clair
                    fontStyle: 'bold',
                    halign: 'right'
                },
                1: { 
                    cellWidth: 45, // Agrandi de 40 à 45mm
                    fontStyle: 'bold',
                    halign: 'right',
                    overflow: 'linebreak', // Retour à la ligne si nécessaire
                    cellPadding: 1.5
                }
            },
            styles: {
                fontSize: 8, // Augmenté de 7 à 8pt
                lineColor: [128, 128, 128],
                lineWidth: 0.6,
                cellPadding: 1.5,
                textColor: [34, 34, 34], // #222222
                overflow: 'linebreak',
                minCellHeight: 6
            },
            didParseCell: function(data) {
                // Colorer la ligne Précompte en vert clair
                if (applyPrecompte && data.row.index === 1 && data.column.index === 0) {
                    data.cell.styles.fillColor = [144, 238, 144]; // Vert clair
                }
            },
            // Position manuelle à droite : pageWidth - margin - largeur du tableau
            margin: { left: pageWidth - margin - totalTableWidth }
        });

        currentY = doc.lastAutoTable.finalY + 10;

        // ========== 8. MONTANT EN LETTRES (comme Python ligne 520-527) ==========
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        
        // Convertir le montant en lettres
        const montantInteger = Math.round(totalTTC);
        const montantEnLettres = numberToFrench(montantInteger);
        const phrase = `Arrêté la présente facture à la somme de : ${montantEnLettres} francs CFA`;
        
        // Centré (alignment=1 dans Python)
        const splitAmount = doc.splitTextToSize(phrase, pageWidth - 2 * margin);
        splitAmount.forEach(line => {
            doc.text(line, pageWidth / 2, currentY, { align: 'center' });
            currentY += 5;
        });
        
        currentY += 10;

        // ========== 9. SIGNATURE (comme Python ligne 530-536) ==========
        // "Le Responsable" aligné à droite (pas "Le Gérant")
        currentY += 24; // Spacer(1, 24) comme Python
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text("Le Responsable", pageWidth - margin, currentY, { align: 'right' });

        // ========== OUVRIR LE PDF ==========
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');

        return { success: true };

    } catch (error) {
        console.error('❌ Erreur génération PDF:', error);
        throw error;
    }
};


/**
 * Télécharge le PDF au lieu de l'ouvrir
 */
export const downloadFacturePDF = async (facture, lignes, client, entreprise) => {
    try {
        // TODO: Implémenter si nécessaire
        console.log('📥 Téléchargement PDF pas encore implémenté');
        return { success: false };
    } catch (error) {
        console.error('❌ Erreur téléchargement PDF:', error);
        throw error;
    }
};

/**
 * Génère le PDF d'un devis (EXACTEMENT comme Python reports/devis_pdf.py)
 * Structure ligne 507-547
 */
export const generateDevisPDF = async (devis, lignes, client, entreprise) => {
    try {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 16;
        let currentY = 10;

        // ========== 1. LOGO ==========
        if (entreprise.logo_path && entreprise.logo_path.trim() !== '') {
            try {
                const logoWidth = 60;
                const logoHeight = 25;
                const logoX = (pageWidth - logoWidth) / 2;
                
                let format = 'PNG';
                if (entreprise.logo_path.includes('data:image/jpeg') || entreprise.logo_path.includes('data:image/jpg')) {
                    format = 'JPEG';
                } else if (entreprise.logo_path.includes('data:image/png')) {
                    format = 'PNG';
                }
                
                doc.addImage(entreprise.logo_path, format, logoX, currentY, logoWidth, logoHeight);
                currentY += logoHeight + 2;
            } catch (error) {
                currentY += 20;
            }
        } else {
            currentY += 20;
        }

        // ========== 2. TAGLINE ==========
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.setFont('helvetica', 'normal');
        const tagline = "Ingénierie Informatique – Maintenance Informatique – Câblage réseaux Informatiques et Électrique – Interconnexions – Électronique et Domotique – Courants Forts et faibles – Contrôles d'Accès – Vidéosurveillance – Formation";
        
        const splitTagline = doc.splitTextToSize(tagline, pageWidth - 2 * margin);
        splitTagline.forEach(line => {
            doc.text(line, pageWidth / 2, currentY, { align: 'center' });
            currentY += 3;
        });

        currentY += 2;
        doc.setDrawColor(211, 211, 211);
        doc.setLineWidth(0.6);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 5;

        // ========== 3. DATE ==========
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const dateStr = devis.date_devis 
            ? new Date(devis.date_devis).toLocaleDateString('fr-FR')
            : new Date().toLocaleDateString('fr-FR');
        const ville = entreprise.adresse ? entreprise.adresse.split(',')[0].trim() : 'Douala';
        doc.text(`${ville}, le ${dateStr}`, pageWidth - margin, currentY, { align: 'right' });
        currentY += 8;

        // ========== 4. INFO BOX (comme Python ligne 295-325) ==========
        // Seulement : DEVIS N°, CLIENT, NIF, TELEPHONE (PAS DE VALIDITÉ)
        const infoData = [
            ['DEVIS N°', devis.numero_devis || 'N/A'],
            ['CLIENT', client?.nom || 'Client'],
            ['NIF', client?.nif || ''],
            ['TELEPHONE', client?.telephone || '']
        ];

        autoTable(doc, {
            startY: currentY,
            body: infoData,
            theme: 'plain',
            columnStyles: {
                0: { 
                    cellWidth: 28, 
                    fillColor: [255, 200, 124], // Orange clair
                    textColor: [0, 0, 0],
                    fontStyle: 'bold'
                },
                1: { 
                    cellWidth: 70,
                    textColor: [0, 0, 0]
                }
            },
            styles: {
                fontSize: 8,
                cellPadding: 2,
                lineColor: [128, 128, 128],
                lineWidth: 0.6
            },
            tableWidth: 'auto',
            margin: { left: margin }
        });

        currentY = doc.lastAutoTable.finalY + 10;

        // ========== 5. SECTION BANNER (comme Python ligne 328-345) ==========
        const bannerText = devis.description && devis.description.trim() 
            ? devis.description.toUpperCase() 
            : 'ACHAT STORES SUPPLEMENTAIRES'; // Défaut comme Python ligne 531

        autoTable(doc, {
            startY: currentY,
            body: [[bannerText]],
            theme: 'plain',
            styles: {
                fillColor: [255, 140, 0], // Orange foncé
                textColor: [255, 255, 255],
                halign: 'center',
                fontSize: 10,
                fontStyle: 'bold',
                cellPadding: 6
            },
            tableWidth: 185,
            margin: { left: margin }
        });

        currentY = doc.lastAutoTable.finalY + 10;

        // ========== 6. TABLEAU DES ARTICLES (dimensions réduites) ==========
        const tableData = lignes.map(ligne => [
            ligne.designation || ligne.article_nom || 'Article',
            String(ligne.quantite || 1),
            formatCurrency(ligne.prix_unitaire || 0),
            formatCurrency(ligne.montant_ht || ligne.total_ht || 0)
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Désignation', 'Quantité', 'Prix Unitaire', 'Montant Total']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [255, 140, 0], // Orange foncé (comme le vert foncé des factures)
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9,
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 9,
                textColor: [0, 0, 0],
                cellPadding: 3
            },
            columnStyles: {
                0: { cellWidth: 75, halign: 'left' },
                1: { cellWidth: 18, halign: 'right' },
                2: { cellWidth: 33, halign: 'right' },
                3: { cellWidth: 33, halign: 'right' }
            },
            styles: {
                lineColor: [211, 211, 211],
                lineWidth: 0.25,
                cellPadding: 2,
                overflow: 'linebreak',
                halign: 'left'
            },
            margin: { left: margin, right: margin }
        });

        currentY = doc.lastAutoTable.finalY + 12;

        // ========== 7. TOTAUX (comme Python ligne 388-423) ==========
        // Utiliser les totaux du devis directement (pas recalculer depuis lignes)
        const totalHT = devis.total_ht || devis.montant_ht || 0;
        const precomptePercent = devis.precompte_applique ? 9.5 : 0;
        const precompte = Math.round(totalHT * (precomptePercent / 100.0));
        const netAPayer = Math.round(totalHT - precompte);

        const totauxData = [
            ['Total', formatCurrencyFull(totalHT)],
            [precomptePercent > 0 ? `Précompte ${precomptePercent}%` : 'Précompte', formatCurrencyFull(precompte)],
            ['Net à payer', formatCurrencyFull(netAPayer)]
        ];

        const totalTableWidth = 95; // 50mm + 45mm
        autoTable(doc, {
            startY: currentY,
            body: totauxData,
            theme: 'grid',
            columnStyles: {
                0: { 
                    cellWidth: 50,
                    fillColor: [255, 200, 124], // Orange clair (comme le vert clair des factures)
                    fontStyle: 'bold',
                    halign: 'right'
                },
                1: { 
                    cellWidth: 45,
                    fontStyle: 'bold',
                    halign: 'right',
                    overflow: 'linebreak',
                    cellPadding: 1.5
                }
            },
            styles: {
                fontSize: 8,
                lineColor: [128, 128, 128],
                lineWidth: 0.6,
                cellPadding: 1.5,
                textColor: [34, 34, 34],
                overflow: 'linebreak',
                minCellHeight: 6
            },
            margin: { left: pageWidth - margin - totalTableWidth }
        });

        currentY = doc.lastAutoTable.finalY + 10;

        // ========== 8. MONTANT EN LETTRES (comme Python ligne 544, fonction build_amount_in_words) ==========
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        
        const montantEnLettres = numberToFrench(netAPayer); // Utiliser netAPayer pas totalTTC
        const phrase = `Arrêté le présent devis à la somme de : ${montantEnLettres} francs CFA`;
        
        const splitAmount = doc.splitTextToSize(phrase, pageWidth - 2 * margin);
        splitAmount.forEach(line => {
            doc.text(line, pageWidth / 2, currentY, { align: 'center' });
            currentY += 5;
        });
        
        currentY += 10;

        // ========== 9. SIGNATURE (comme Python build_signature_only ligne 500-504) ==========
        currentY += 24; // Spacer(1, 24) comme Python ligne 501
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text("Le Responsable", pageWidth - margin, currentY, { align: 'right' });

        // Ouvrir le PDF
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
        
    } catch (error) {
        console.error('❌ Erreur génération PDF devis:', error);
        throw error;
    }
};
