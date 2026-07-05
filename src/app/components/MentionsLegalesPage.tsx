import { LegalPage, LegalSection } from "./LegalPage";

const sections: LegalSection[] = [
  {
    id: "editeur",
    title: "Éditeur du site",
    body: (
      <>
        <p>
          Le présent site est édité par <strong>IPPOO ASSURANCE SA</strong>, société anonyme de micro-assurance
          de droit béninois, au capital social de <strong>1 000 000 000 FCFA</strong> entièrement libéré.
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Siège social :</strong> Parakou, Borgou, Bénin</li>
          <li><strong>RCCM :</strong> BJ-COT-2023-B-XXXXX</li>
          <li><strong>Identifiant fiscal (CC) :</strong> XXXXXXX X</li>
          <li><strong>Téléphone :</strong> +229 01 41 52 10 92</li>
          <li><strong>WhatsApp :</strong> +229 01 41 52 10 92</li>
          <li><strong>Adresse électronique :</strong> contact@ippoo.bj</li>
          <li><strong>Directeur de la publication :</strong> Le Directeur Général d'IPPOO ASSURANCE SA</li>
        </ul>
      </>
    ),
  },
  {
    id: "agrement",
    title: "Agrément et autorité de tutelle",
    body: (
      <>
        <p>
          IPPOO ASSURANCE SA est agréée en qualité d'entreprise de <strong>micro-assurance</strong> par arrêté du
          Ministre en charge des Finances de la République du Bénin, sur avis conforme de la Commission
          Régionale de Contrôle des Assurances (CRCA) de la <strong>Conférence Interafricaine des Marchés
          d'Assurances (CIMA)</strong>.
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>N° d'agrément CIMA :</strong> XXXX/MEF/DGTCP/DA</li>
          <li><strong>Date d'agrément :</strong> JJ/MM/AAAA</li>
          <li><strong>Branches autorisées :</strong> micro-assurance vie et non-vie, assistance, prévoyance, santé</li>
        </ul>
        <p>
          L'autorité de tutelle est l'<strong>Autorité de Régulation et de Surveillance des Compagnies d'assurances
          (ARSC)</strong> de la République du Bénin.
        </p>
      </>
    ),
  },
  {
    id: "hebergement",
    title: "Hébergement",
    body: (
      <p>
        Le site est hébergé par un prestataire technique conforme aux standards de sécurité ISO 27001 et aux exigences
        de la loi béninoise n°2017-20 du 20 avril 2018 portant Code du numérique en République du Bénin, en matière
        de protection des données d'assurés.
      </p>
    ),
  },
  {
    id: "propriete",
    title: "Propriété intellectuelle",
    body: (
      <>
        <p>
          L'ensemble des éléments composant le site (textes, graphismes, logos, photographies, illustrations,
          arborescence, code source, identité visuelle, marque IPPOO et Carte IPPOO) est protégé par les législations
          béninoise et internationale relatives au droit d'auteur, au droit des marques et à la propriété intellectuelle.
        </p>
        <p>
          Toute reproduction, représentation, modification, publication ou adaptation, partielle ou intégrale, par
          quelque procédé que ce soit, sans autorisation écrite préalable d'IPPOO ASSURANCE SA, est interdite et
          constitue une contrefaçon sanctionnée par la loi.
        </p>
      </>
    ),
  },
  {
    id: "responsabilite",
    title: "Limitation de responsabilité",
    body: (
      <>
        <p>
          IPPOO ASSURANCE SA s'efforce d'assurer au mieux l'exactitude et la mise à jour des informations diffusées sur
          ce site. Toutefois, les informations à caractère général publiées ne sauraient se substituer aux conditions
          contractuelles (Conditions Générales et Particulières) qui régissent la relation entre l'assuré et l'assureur.
        </p>
        <p>
          Seuls les documents contractuels signés et les attestations émises par IPPOO ASSURANCE engagent juridiquement
          la société. Les simulations de cotisation présentées sur le site sont indicatives et non opposables.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies & traceurs",
    body: (
      <>
        <p>
          Le site utilise des cookies strictement nécessaires à son fonctionnement, ainsi que des cookies de mesure
          d'audience anonymisés. Aucun cookie publicitaire ou de profilage n'est déposé sans le consentement explicite
          de l'utilisateur, conformément aux recommandations de l'<strong>ARTCI</strong> (Autorité de Régulation des
          Télécommunications/TIC du Bénin).
        </p>
        <p>
          Pour plus d'informations, consultez notre <a className="text-[#0B6E4F] underline" href="/confidentialite">Politique de confidentialité</a>.
        </p>
      </>
    ),
  },
  {
    id: "loi",
    title: "Loi applicable et juridiction",
    body: (
      <p>
        Les présentes mentions légales sont régies par le droit béninois et, à titre supranational, par le Code des
        Assurances CIMA. Tout litige relatif à leur interprétation ou à leur exécution relève de la compétence
        exclusive des juridictions de Parakou, après tentative préalable de règlement amiable auprès du médiateur
        d'IPPOO ASSURANCE.
      </p>
    ),
  },
];

export function MentionsLegalesPage() {
  return (
    <LegalPage
      title="Mentions légales"
      subtitle="Informations légales et réglementaires concernant IPPOO ASSURANCE SA, entreprise de micro-assurance agréée CIMA."
      lastUpdate="23 mai 2026"
      sections={sections}
    />
  );
}
