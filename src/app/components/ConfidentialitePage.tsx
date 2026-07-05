import { LegalPage, LegalSection } from "./LegalPage";

const sections: LegalSection[] = [
  {
    id: "responsable",
    title: "Responsable du traitement",
    body: (
      <p>
        IPPOO ASSURANCE SA, dont le siège social est situé à Parakou, Borgou, Bénin,
        agit en qualité de <strong>responsable du traitement</strong> des données personnelles collectées via le site
        et lors de la souscription, de la gestion et de l'indemnisation de vos contrats de micro-assurance. Un
        Délégué à la Protection des Données (DPO) peut être contacté à l'adresse <strong>contact@ippoo.bj</strong>.
      </p>
    ),
  },
  {
    id: "donnees",
    title: "Données collectées",
    body: (
      <>
        <p>Selon votre parcours, nous pouvons collecter et traiter les catégories de données suivantes :</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Données d'identification :</strong> nom, prénom, date de naissance, sexe, pièce d'identité, photographie.</li>
          <li><strong>Coordonnées :</strong> adresse postale, numéro de téléphone, adresse e-mail.</li>
          <li><strong>Données socioprofessionnelles :</strong> métier, secteur d'activité, lieu d'exercice, revenus déclarés.</li>
          <li><strong>Données contractuelles :</strong> formules souscrites, cotisations, bénéficiaires, sinistres déclarés.</li>
          <li><strong>Données de santé</strong> (uniquement pour les produits santé et maternité) : antécédents médicaux pertinents, factures de soins.</li>
          <li><strong>Données techniques :</strong> adresse IP, type de navigateur, pages consultées, durée de visite.</li>
        </ul>
      </>
    ),
  },
  {
    id: "finalites",
    title: "Finalités du traitement",
    body: (
      <>
        <p>Vos données sont traitées exclusivement pour les finalités suivantes :</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>évaluer votre éligibilité et personnaliser une offre de micro-assurance ;</li>
          <li>conclure, exécuter et gérer votre contrat (cotisations, modifications, renouvellements) ;</li>
          <li>instruire et indemniser les sinistres déclarés ;</li>
          <li>respecter nos obligations légales et réglementaires (CIMA, lutte contre le blanchiment, fiscalité) ;</li>
          <li>améliorer la qualité de nos services et mesurer leur usage de manière anonymisée ;</li>
          <li>vous informer, avec votre accord, de nouvelles offres adaptées à votre situation.</li>
        </ul>
      </>
    ),
  },
  {
    id: "base-legale",
    title: "Bases légales",
    body: (
      <p>
        Les traitements reposent selon les cas sur <strong>l'exécution du contrat d'assurance</strong>, sur le
        <strong> respect d'obligations légales</strong> (notamment le Code des Assurances CIMA et la loi béninoise
        n° 2013-450 relative à la protection des données à caractère personnel), sur notre <strong>intérêt
        légitime</strong> (sécurité, prévention de la fraude) ou sur votre <strong>consentement explicite</strong> pour
        les traitements optionnels (prospection, données de santé non strictement nécessaires).
      </p>
    ),
  },
  {
    id: "destinataires",
    title: "Destinataires de vos données",
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>les équipes internes habilitées d'IPPOO ASSURANCE (souscription, indemnisation, comptabilité, conformité) ;</li>
        <li>nos partenaires locaux de confiance, points de service partenaires et centres de santé conventionnés, strictement pour l'exécution du contrat ;</li>
        <li>nos réassureurs et co-assureurs éventuels, dans le cadre des transferts de risque réglementaires ;</li>
        <li>les autorités de contrôle (ARSC, CIMA, autorités fiscales et judiciaires) sur demande légalement fondée ;</li>
        <li>nos prestataires techniques (hébergement, paiement mobile, télécommunication) liés par un contrat de sous-traitance conforme.</li>
      </ul>
    ),
  },
  {
    id: "duree",
    title: "Durée de conservation",
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>Données contractuelles :</strong> durée du contrat, prolongée par les délais de prescription applicables (en principe 5 ans après résiliation).</li>
        <li><strong>Données comptables :</strong> 10 ans, conformément aux obligations OHADA.</li>
        <li><strong>Données de prospection :</strong> 3 ans à compter du dernier contact actif.</li>
        <li><strong>Données techniques anonymisées :</strong> 13 mois maximum.</li>
      </ul>
    ),
  },
  {
    id: "droits",
    title: "Vos droits",
    body: (
      <>
        <p>Conformément à la loi béninoise n° 2013-450 et aux bonnes pratiques inspirées du RGPD européen, vous disposez à tout moment des droits suivants :</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>droit d'<strong>accès</strong> à vos données ;</li>
          <li>droit de <strong>rectification</strong> en cas d'erreur ou d'incomplétude ;</li>
          <li>droit à l'<strong>effacement</strong> (sauf obligation légale de conservation) ;</li>
          <li>droit à la <strong>limitation</strong> ou à l'<strong>opposition</strong> à certains traitements ;</li>
          <li>droit à la <strong>portabilité</strong> de vos données ;</li>
          <li>droit de <strong>retirer votre consentement</strong> à tout moment pour les traitements qui en dépendent ;</li>
          <li>droit d'introduire une <strong>réclamation</strong> auprès de l'ARTCI ou de notre médiateur interne.</li>
        </ul>
        <p>
          Pour exercer ces droits, écrivez à <strong>contact@ippoo.bj</strong> ou par courrier à l'adresse du
          siège social. Une réponse vous sera apportée dans un délai maximal de 30 jours.
        </p>
      </>
    ),
  },
  {
    id: "securite",
    title: "Sécurité",
    body: (
      <p>
        IPPOO ASSURANCE met en œuvre des mesures techniques et organisationnelles appropriées (chiffrement TLS,
        contrôle d'accès, traçabilité, sensibilisation du personnel, audits réguliers) pour protéger vos données
        contre tout accès non autorisé, altération, divulgation ou destruction.
      </p>
    ),
  },
];

export function ConfidentialitePage() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      subtitle="Comment IPPOO ASSURANCE collecte, utilise et protège vos données personnelles, conformément à la loi béninoise n° 2013-450 et aux exigences CIMA."
      lastUpdate="23 mai 2026"
      sections={sections}
    />
  );
}
