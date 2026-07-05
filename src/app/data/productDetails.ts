export interface Garantie {
  risque: string;
  priseEnCharge: string;
  plafond: string;
  franchise: string;
}

export interface Formule {
  nom: string;
  cotisation: string;
  description: string;
  highlight?: boolean;
}

export interface ProductDetails {
  garanties: Garantie[];
  exclusions: string[];
  delaiCarence: string;
  formules: Formule[];
  exempleSinistre: {
    profil: string;
    histoire: string;
    indemnisation: string;
    delai: string;
  };
}

const carenceStd = "15 jours à compter de la prise d'effet du contrat, sauf en cas d'accident (aucune carence).";

export const productDetails: Record<string, ProductDetails> = {
  sante: {
    delaiCarence: "30 jours pour les soins courants, 90 jours pour l'hospitalisation programmée, 10 mois pour la maternité. Aucun délai pour l'accident.",
    garanties: [
      { risque: "Consultation médecin généraliste", priseEnCharge: "80 %", plafond: "15 consultations / an", franchise: "500 FCFA / acte" },
      { risque: "Consultation médecin spécialiste", priseEnCharge: "70 %", plafond: "8 consultations / an", franchise: "1 000 FCFA / acte" },
      { risque: "Médicaments prescrits", priseEnCharge: "70 %", plafond: "300 000 FCFA / an", franchise: "Aucune" },
      { risque: "Hospitalisation médicale", priseEnCharge: "80 %", plafond: "2 500 000 FCFA / an", franchise: "10 000 FCFA / séjour" },
      { risque: "Examens biologiques & imagerie", priseEnCharge: "60 %", plafond: "200 000 FCFA / an", franchise: "Aucune" },
      { risque: "Soins dentaires de base", priseEnCharge: "50 %", plafond: "100 000 FCFA / an", franchise: "2 000 FCFA / acte" },
    ],
    exclusions: [
      "Maladies préexistantes non déclarées à la souscription",
      "Cures thermales, médecines douces non prescrites",
      "Chirurgie esthétique non réparatrice",
      "Sinistres consécutifs à la consommation d'alcool ou de stupéfiants",
      "Pratiques sportives à risque non déclarées",
      "Soins reçus hors du réseau des centres conventionnés (hors urgence vitale)",
    ],
    formules: [
      { nom: "Essentielle", cotisation: "15 500 FCFA / mois", description: "Couverture des consultations et médicaments essentiels pour l'assuré principal." },
      { nom: "Famille", cotisation: "15 500 FCFA / mois", description: "Étend la couverture au conjoint et jusqu'à 4 enfants, inclut l'hospitalisation.", highlight: true },
      { nom: "Sérénité", cotisation: "15 500 FCFA / mois", description: "Famille étendue, plafonds doublés, prise en charge des examens et soins dentaires." },
    ],
    exempleSinistre: {
      profil: "Aminata, 34 ans, vendeuse au marché de Dantokpa",
      histoire: "Atteinte d'un paludisme sévère, Aminata est hospitalisée 4 jours et reçoit un traitement médicamenteux complet. Sa formule Famille couvre 80 % des frais d'hospitalisation et 70 % des médicaments.",
      indemnisation: "168 000 FCFA pris en charge sur 215 000 FCFA de frais",
      delai: "Règlement direct au centre de santé en 48h",
    },
  },
  marchandises: {
    delaiCarence: carenceStd,
    garanties: [
      { risque: "Vol sur le lieu de vente (avec effraction)", priseEnCharge: "Valeur de remplacement", plafond: "1 500 000 FCFA / sinistre", franchise: "10 %" },
      { risque: "Incendie accidentel", priseEnCharge: "Valeur de remplacement", plafond: "2 000 000 FCFA / sinistre", franchise: "5 %" },
      { risque: "Inondation liée aux pluies saisonnières", priseEnCharge: "Valeur de remplacement", plafond: "1 500 000 FCFA / sinistre", franchise: "10 %" },
      { risque: "Détérioration accidentelle (chute, casse)", priseEnCharge: "80 %", plafond: "500 000 FCFA / an", franchise: "15 000 FCFA" },
    ],
    exclusions: [
      "Vol sans trace d'effraction ou disparition inexpliquée",
      "Pertes liées à une mauvaise gestion ou à un défaut de conservation prévisible",
      "Marchandises périssables hors emballage d'origine",
      "Stocks non déclarés ou dépassant la valeur souscrite",
      "Sinistres survenus avant la prise d'effet ou pendant la période de carence",
    ],
    formules: [
      { nom: "Étal", cotisation: "15 500 FCFA / mois", description: "Stock jusqu'à 500 000 FCFA, garanties vol et incendie." },
      { nom: "Boutique", cotisation: "15 500 FCFA / mois", description: "Stock jusqu'à 1 500 000 FCFA, toutes garanties incluses.", highlight: true },
      { nom: "Grossiste", cotisation: "15 500 FCFA / mois", description: "Stock jusqu'à 3 000 000 FCFA, plafonds majorés et inventaire annuel offert." },
    ],
    exempleSinistre: {
      profil: "Ibrahim, grossiste de tissus à Akpakpa",
      histoire: "Une inondation de fin août endommage la moitié de son stock pendant la saison des pluies. Inventaire conjoint avec un expert IPPOO le lendemain de la déclaration.",
      indemnisation: "1 200 000 FCFA versés (après franchise)",
      delai: "Indemnisation 7 jours ouvrés après remise du dossier complet",
    },
  },
  equipement: {
    delaiCarence: carenceStd,
    garanties: [
      { risque: "Vol d'outils avec effraction", priseEnCharge: "Valeur de remplacement", plafond: "800 000 FCFA / sinistre", franchise: "10 %" },
      { risque: "Casse accidentelle", priseEnCharge: "Réparation ou remplacement", plafond: "500 000 FCFA / an", franchise: "10 000 FCFA" },
      { risque: "Usure prématurée (usage intensif déclaré)", priseEnCharge: "60 %", plafond: "200 000 FCFA / an", franchise: "Aucune" },
      { risque: "Prêt d'outil de remplacement", priseEnCharge: "Inclus", plafond: "Jusqu'à 7 jours", franchise: "Aucune" },
    ],
    exclusions: [
      "Outils non identifiés ou non listés à la souscription",
      "Détériorations par négligence manifeste ou mauvaise utilisation",
      "Outils prêtés à un tiers sans déclaration préalable",
      "Pannes purement électriques sur matériels non entretenus",
    ],
    formules: [
      { nom: "Atelier", cotisation: "15 500 FCFA / mois", description: "Jusqu'à 5 outils déclarés, garanties vol et casse." },
      { nom: "Pro", cotisation: "15 500 FCFA / mois", description: "Jusqu'à 15 outils, inclut l'usure et le prêt d'outil.", highlight: true },
      { nom: "Chantier", cotisation: "15 500 FCFA / mois", description: "Outils mobiles et équipements lourds, plafonds majorés." },
    ],
    exempleSinistre: {
      profil: "Konan, soudeur indépendant à Cadjehoun",
      histoire: "Son poste à souder est dérobé dans son atelier après effraction nocturne. Le dépôt de plainte et la déclaration en ligne sont effectués le lendemain.",
      indemnisation: "540 000 FCFA versés (valeur de remplacement, franchise 10 %)",
      delai: "Prêt d'outil le jour même, indemnisation en 5 jours",
    },
  },
  transport: {
    delaiCarence: carenceStd,
    garanties: [
      { risque: "Accident léger (carrosserie, dégâts matériels)", priseEnCharge: "80 %", plafond: "600 000 FCFA / sinistre", franchise: "20 000 FCFA" },
      { risque: "Vol du véhicule", priseEnCharge: "Valeur du marché", plafond: "1 200 000 FCFA", franchise: "10 %" },
      { risque: "Panne mécanique imprévue", priseEnCharge: "Réparation", plafond: "150 000 FCFA / an", franchise: "5 000 FCFA" },
      { risque: "Assistance dépannage 24h/24", priseEnCharge: "Inclus", plafond: "3 interventions / an", franchise: "Aucune" },
    ],
    exclusions: [
      "Conduite sans permis valide ou avec un permis non adapté",
      "Conduite sous l'emprise d'alcool ou de stupéfiants",
      "Course, compétition ou usage hors voie publique",
      "Surcharge avérée du véhicule",
      "Défaut d'entretien manifeste (frein, pneus lisses)",
    ],
    formules: [
      { nom: "Vélo / Charrette", cotisation: "15 500 FCFA / mois", description: "Garanties vol et accident léger." },
      { nom: "Moto / Tricycle", cotisation: "15 500 FCFA / mois", description: "Toutes garanties incluses, assistance dépannage 24h/24.", highlight: true },
      { nom: "Flotte", cotisation: "15 500 FCFA / mois", description: "À partir de 3 véhicules, conditions ajustées et gestionnaire dédié." },
    ],
    exempleSinistre: {
      profil: "Moussa, conducteur de taxi-moto à Haie Vive",
      histoire: "Accrochage avec une voiture en heure de pointe. La déclaration est faite via WhatsApp, photos à l'appui. Sa moto est immobilisée 4 jours.",
      indemnisation: "165 000 FCFA de réparation + indemnité d'immobilisation",
      delai: "Prise en charge sous 72h",
    },
  },
  maternite: {
    delaiCarence: "10 mois calendaires à compter de la prise d'effet.",
    garanties: [
      { risque: "Consultation prénatale (jusqu'à 8 visites)", priseEnCharge: "100 %", plafond: "8 consultations / grossesse", franchise: "Aucune" },
      { risque: "Échographies (3 obligatoires)", priseEnCharge: "100 %", plafond: "3 examens / grossesse", franchise: "Aucune" },
      { risque: "Accouchement en centre conventionné", priseEnCharge: "100 %", plafond: "Forfait 250 000 FCFA", franchise: "Aucune" },
      { risque: "Césarienne (si nécessaire)", priseEnCharge: "90 %", plafond: "Forfait 500 000 FCFA", franchise: "Aucune" },
      { risque: "Consultations post-partum (2 visites)", priseEnCharge: "100 %", plafond: "2 consultations", franchise: "Aucune" },
      { risque: "Kit bébé (couches, vêtements, hygiène)", priseEnCharge: "Inclus", plafond: "1 kit / naissance", franchise: "Aucune" },
    ],
    exclusions: [
      "Grossesses déclarées avant la souscription du contrat",
      "Interruptions volontaires de grossesse (sauf indication médicale)",
      "Soins reçus hors du réseau de centres conventionnés (hors urgence vitale)",
      "Traitements de fertilité ou procréation médicalement assistée",
    ],
    formules: [
      { nom: "Maternité Sereine", cotisation: "15 500 FCFA / mois", description: "Couverture complète prénatale, accouchement et post-partum, kit bébé inclus.", highlight: true },
    ],
    exempleSinistre: {
      profil: "Fatou, 28 ans, coiffeuse à Fidjrossè",
      histoire: "Suivi prénatal complet et accouchement par césarienne dans un centre de santé conventionné. Kit bébé remis le jour de la sortie de maternité.",
      indemnisation: "Forfait césarienne 500 000 FCFA + soins prénataux pris en charge",
      delai: "Prise en charge directe sans avance de frais",
    },
  },
  education: {
    delaiCarence: "60 jours, ajusté au calendrier scolaire en cours.",
    garanties: [
      { risque: "Fournitures scolaires (cahiers, stylos, manuels)", priseEnCharge: "Forfait", plafond: "25 000 FCFA / enfant / an", franchise: "Aucune" },
      { risque: "Uniformes scolaires", priseEnCharge: "Forfait", plafond: "20 000 FCFA / enfant / an", franchise: "Aucune" },
      { risque: "Frais d'inscription annuels (école publique)", priseEnCharge: "80 %", plafond: "60 000 FCFA / enfant", franchise: "Aucune" },
      { risque: "Frais d'inscription (école privée conventionnée)", priseEnCharge: "50 %", plafond: "150 000 FCFA / enfant", franchise: "Aucune" },
    ],
    exclusions: [
      "Frais d'établissements non reconnus par le Ministère de l'Éducation",
      "Études supérieures et formations professionnelles (hors apprentissage)",
      "Voyages scolaires et activités extra-scolaires",
      "Sorties pédagogiques exceptionnelles non incluses dans la scolarité de base",
    ],
    formules: [
      { nom: "1 enfant", cotisation: "15 500 FCFA / mois", description: "Couverture pour un enfant scolarisé." },
      { nom: "2-4 enfants", cotisation: "15 500 FCFA / mois", description: "Tarif dégressif pour plusieurs enfants d'une même famille.", highlight: true },
      { nom: "Famille étendue", cotisation: "15 500 FCFA / mois", description: "5 enfants et plus, conditions négociables." },
    ],
    exempleSinistre: {
      profil: "Awa, mère de 3 enfants à Parakou",
      histoire: "Récupère son indemnité scolaire en août, avant la rentrée. Présentation des justificatifs (carnet scolaire, devis de fournitures) auprès du point partenaire local.",
      indemnisation: "78 000 FCFA versés pour 3 enfants (fournitures + uniformes)",
      delai: "Versement sous 5 jours ouvrés",
    },
  },
  retraite: {
    delaiCarence: "Aucune carence, le capital se constitue dès la première cotisation.",
    garanties: [
      { risque: "Constitution d'un capital épargne", priseEnCharge: "100 % des versements", plafond: "Sans plafond", franchise: "Aucune" },
      { risque: "Rendement annuel net garanti", priseEnCharge: "3,5 % minimum", plafond: "Capitalisé chaque année", franchise: "Aucune" },
      { risque: "Versement d'une rente viagère (à partir de 55 ans)", priseEnCharge: "Mensuel", plafond: "Selon capital constitué", franchise: "Aucune" },
      { risque: "Capital décès reversé aux bénéficiaires", priseEnCharge: "100 % du capital", plafond: "Sans plafond", franchise: "Aucune" },
    ],
    exclusions: [
      "Retrait anticipé avant 5 ans d'ancienneté (sauf cas de force majeure)",
      "Versements non déclarés ou en dehors du contrat",
    ],
    formules: [
      { nom: "Petits pas", cotisation: "15 500 FCFA / mois", description: "Démarrer en douceur, idéal pour les revenus très variables." },
      { nom: "Régulier", cotisation: "15 500 FCFA / mois", description: "Construire un capital significatif à horizon 10-15 ans.", highlight: true },
      { nom: "Ambition", cotisation: "15 500 FCFA / mois", description: "Préparer une rente confortable, capital majoré." },
    ],
    exempleSinistre: {
      profil: "Yao, 58 ans, ancien artisan menuisier à Bohicon",
      histoire: "Après 8 ans de cotisations régulières (5 000 FCFA/mois), Yao demande la conversion de son capital en rente viagère pour compléter ses revenus.",
      indemnisation: "Rente mensuelle de 22 000 FCFA versée à vie",
      delai: "Mise en service en 15 jours",
    },
  },
  sociale: {
    delaiCarence: "90 jours pour le décès et l'invalidité (sauf accident).",
    garanties: [
      { risque: "Décès toutes causes (assuré principal)", priseEnCharge: "Forfait", plafond: "1 500 000 FCFA", franchise: "Aucune" },
      { risque: "Indemnité funéraire (membre famille direct)", priseEnCharge: "Forfait", plafond: "500 000 FCFA / décès", franchise: "Aucune" },
      { risque: "Invalidité permanente totale", priseEnCharge: "Capital", plafond: "1 000 000 FCFA", franchise: "Aucune" },
      { risque: "Responsabilité civile (dommages à autrui)", priseEnCharge: "100 % du préjudice indemnisé", plafond: "2 000 000 FCFA / an", franchise: "20 000 FCFA" },
    ],
    exclusions: [
      "Suicide dans les 12 premiers mois du contrat",
      "Décès résultant d'une faute intentionnelle ou d'un acte criminel",
      "Dommages causés intentionnellement ou résultant d'une activité illégale",
      "Litiges familiaux entre assurés du même contrat",
    ],
    formules: [
      { nom: "Solidarité", cotisation: "15 500 FCFA / mois", description: "Indemnité funéraire et responsabilité civile de base." },
      { nom: "Famille protégée", cotisation: "15 500 FCFA / mois", description: "Capital décès, invalidité et RC élargie.", highlight: true },
    ],
    exempleSinistre: {
      profil: "Famille de M. Diabaté, mécanicien décédé",
      histoire: "Après le décès accidentel de M. Diabaté, sa famille déclare le sinistre auprès du point partenaire local avec acte de décès et copie de la Carte IPPOO.",
      indemnisation: "1 500 000 FCFA + 250 000 FCFA d'indemnité funéraire",
      delai: "Versement intégral en 10 jours",
    },
  },
  juridique: {
    delaiCarence: "30 jours pour les litiges contractuels, immédiat pour les urgences.",
    garanties: [
      { risque: "Conseil juridique téléphonique", priseEnCharge: "Illimité", plafond: "Tous domaines courants", franchise: "Aucune" },
      { risque: "Rédaction d'un courrier ou d'une mise en demeure", priseEnCharge: "100 %", plafond: "4 actes / an", franchise: "Aucune" },
      { risque: "Représentation devant le tribunal de simple police", priseEnCharge: "100 %", plafond: "300 000 FCFA / litige", franchise: "Aucune" },
      { risque: "Médiation amiable encadrée par un avocat partenaire", priseEnCharge: "100 %", plafond: "2 médiations / an", franchise: "Aucune" },
    ],
    exclusions: [
      "Litiges antérieurs à la souscription du contrat",
      "Affaires pénales pour faits intentionnels",
      "Litiges entre assurés du même contrat",
      "Procédures de divorce contentieux",
    ],
    formules: [
      { nom: "Conseil", cotisation: "15 500 FCFA / mois", description: "Accès illimité au conseil juridique téléphonique." },
      { nom: "Litiges", cotisation: "15 500 FCFA / mois", description: "Tout le conseil + représentation simple et médiation.", highlight: true },
    ],
    exempleSinistre: {
      profil: "Salimata, vendeuse, en litige avec un fournisseur",
      histoire: "Un fournisseur refuse de livrer une commande payée d'avance. Un avocat partenaire IPPOO rédige une mise en demeure puis obtient un règlement amiable.",
      indemnisation: "Restitution intégrale de l'acompte (185 000 FCFA)",
      delai: "Résolution en 21 jours",
    },
  },
  comptable: {
    delaiCarence: "Aucune, accompagnement actif dès la souscription.",
    garanties: [
      { risque: "Tenue simplifiée recettes / dépenses", priseEnCharge: "Inclus", plafond: "Mensuel", franchise: "Aucune" },
      { risque: "Conseil fiscal personnalisé", priseEnCharge: "Inclus", plafond: "4 rendez-vous / an", franchise: "Aucune" },
      { risque: "Préparation déclaration fiscale simplifiée", priseEnCharge: "100 %", plafond: "1 déclaration annuelle", franchise: "Aucune" },
      { risque: "Assistance contrôle fiscal", priseEnCharge: "100 %", plafond: "1 contrôle / an", franchise: "Aucune" },
    ],
    exclusions: [
      "Contentieux fiscaux antérieurs à la souscription",
      "Tenue d'une comptabilité OHADA complète (régime du réel)",
      "Audit légal ou commissariat aux comptes",
    ],
    formules: [
      { nom: "Suivi", cotisation: "15 500 FCFA / mois", description: "Tenue mensuelle et conseil fiscal." },
      { nom: "Complet", cotisation: "15 500 FCFA / mois", description: "Tout inclus, plus assistance contrôle fiscal.", highlight: true },
    ],
    exempleSinistre: {
      profil: "Ouattara, prestataire de services à Porto-Novo",
      histoire: "Convocation à un contrôle fiscal. Un conseiller IPPOO l'accompagne, prépare les pièces et l'aide à régulariser une omission mineure.",
      indemnisation: "Amende évitée (estimée à 200 000 FCFA)",
      delai: "Préparation du dossier en 10 jours",
    },
  },
  administrative: {
    delaiCarence: "Aucune, accompagnement immédiat.",
    garanties: [
      { risque: "Renouvellement carte d'identité ou permis", priseEnCharge: "Accompagnement complet", plafond: "2 démarches / an", franchise: "Aucune" },
      { risque: "Dossier de domiciliation professionnelle", priseEnCharge: "Accompagnement complet", plafond: "1 dossier / an", franchise: "Aucune" },
      { risque: "Demande d'autorisation d'étal ou de circulation", priseEnCharge: "Accompagnement complet", plafond: "Illimité", franchise: "Aucune" },
      { risque: "Suivi administratif et relances", priseEnCharge: "100 %", plafond: "Inclus", franchise: "Aucune" },
    ],
    exclusions: [
      "Frais administratifs publics (timbres, droits de chancellerie)",
      "Démarches frauduleuses ou non conformes à la loi",
      "Démarches hors du territoire de couverture",
    ],
    formules: [
      { nom: "Accès", cotisation: "15 500 FCFA / mois", description: "Démarches essentielles et suivi." },
      { nom: "Premium", cotisation: "15 500 FCFA / mois", description: "Démarches illimitées et conseiller dédié.", highlight: true },
    ],
    exempleSinistre: {
      profil: "Mariam, vendeuse au marché de Natitingou",
      histoire: "Doit renouveler son autorisation d'étal en urgence avant un contrôle municipal. Un agent partenaire IPPOO l'accompagne en mairie.",
      indemnisation: "Autorisation obtenue avant l'échéance, activité préservée",
      delai: "3 jours ouvrés",
    },
  },
};
