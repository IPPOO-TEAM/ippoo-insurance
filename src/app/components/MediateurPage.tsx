import { LegalPage, LegalSection } from "./LegalPage";

const sections: LegalSection[] = [
  {
    id: "principes",
    title: "Nos engagements",
    body: (
      <p>
        IPPOO ASSURANCE s'engage à traiter chaque réclamation avec <strong>équité, transparence et célérité</strong>.
        La procédure de réclamation et de médiation est <strong>gratuite</strong>, ouverte à tout assuré, bénéficiaire
        ou tiers concerné par un contrat IPPOO, et accessible quel que soit votre canal d'origine (agence, point
        partenaire, téléphone, site web, mobile).
      </p>
    ),
  },
  {
    id: "etape-1",
    title: "Étape 1 Service Relations Clients",
    body: (
      <>
        <p>
          Pour toute insatisfaction concernant la souscription, la gestion ou l'indemnisation d'un contrat, contactez
          d'abord notre <strong>service Relations Clients</strong> :
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>par e-mail : <strong>contact@ippoo.bj</strong></li>
          <li>par téléphone ou WhatsApp : <strong>+229 01 41 52 10 92</strong> (du lundi au vendredi, 8h–18h)</li>
          <li>par courrier : IPPOO ASSURANCE, Service Relations Clients, Parakou, Borgou, Bénin</li>
          <li>dans tout point de service partenaire</li>
        </ul>
        <p>
          Nous accusons réception sous <strong>5 jours ouvrés</strong> et nous nous engageons à apporter une réponse
          motivée sous <strong>30 jours</strong> maximum.
        </p>
      </>
    ),
  },
  {
    id: "etape-2",
    title: "Étape 2 Médiateur interne IPPOO",
    body: (
      <>
        <p>
          Si la réponse du service Relations Clients ne vous satisfait pas, ou en cas d'absence de réponse au-delà de
          30 jours, vous pouvez saisir gratuitement notre <strong>médiateur interne</strong>, indépendant des
          équipes opérationnelles. Sa mission est de réexaminer votre dossier en toute impartialité.
        </p>
        <p>
          Saisine : <strong>contact@ippoo.bj</strong> en joignant la copie de votre réclamation initiale
          et la réponse reçue. Le médiateur dispose d'un délai maximal de <strong>60 jours</strong> pour rendre son
          avis motivé.
        </p>
      </>
    ),
  },
  {
    id: "etape-3",
    title: "Étape 3 Médiateur de la CIMA",
    body: (
      <p>
        En dernier recours, et si le différend persiste, vous pouvez saisir le <strong>médiateur de la Conférence
        Interafricaine des Marchés d'Assurances (CIMA)</strong>, dont les coordonnées sont disponibles sur
        <a className="text-[#0B6E4F] underline" href="https://www.cima-afrique.org" target="_blank" rel="noreferrer">
          {" "}le site officiel de la CIMA
        </a>. Cette saisine est également gratuite et ne préjuge pas de votre droit d'agir en justice.
      </p>
    ),
  },
  {
    id: "judiciaire",
    title: "Recours juridictionnel",
    body: (
      <p>
        À tout moment, vous conservez la faculté de saisir les juridictions compétentes du ressort du siège social
        d'IPPOO ASSURANCE. Toutefois, nous vous encourageons vivement à privilégier la voie amiable, plus rapide et
        moins coûteuse, en suivant les trois étapes décrites ci-dessus.
      </p>
    ),
  },
  {
    id: "delais",
    title: "Récapitulatif des délais",
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Accusé de réception réclamation : <strong>5 jours ouvrés</strong></li>
        <li>Réponse motivée Relations Clients : <strong>30 jours maximum</strong></li>
        <li>Avis du médiateur interne : <strong>60 jours maximum</strong></li>
        <li>Prescription de l'action contractuelle : <strong>2 ans</strong> à compter de l'événement (art. 28 Code CIMA)</li>
      </ul>
    ),
  },
];

export function MediateurPage() {
  return (
    <LegalPage
      title="Médiation & réclamations"
      subtitle="Une procédure gratuite, lisible et indépendante pour faire valoir vos droits en cas de désaccord avec IPPOO ASSURANCE."
      lastUpdate="23 mai 2026"
      sections={sections}
    />
  );
}
