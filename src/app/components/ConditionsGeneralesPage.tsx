import { LegalPage, LegalSection } from "./LegalPage";

const sections: LegalSection[] = [
  {
    id: "objet",
    title: "Objet du contrat",
    body: (
      <p>
        Les présentes Conditions Générales (CG) régissent les contrats de micro-assurance et d'assistance souscrits
        auprès d'<strong>IPPOO ASSURANCE SA</strong>. Elles définissent les droits et obligations de l'assuré,
        des bénéficiaires éventuels et de l'assureur. Chaque contrat est complété par des
        <strong> Conditions Particulières (CP)</strong> propres à la formule retenue, qui précisent les garanties,
        plafonds, franchises et délais de carence applicables.
      </p>
    ),
  },
  {
    id: "definitions",
    title: "Définitions",
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>Assuré :</strong> la personne physique ou morale sur laquelle repose le risque garanti.</li>
        <li><strong>Souscripteur :</strong> la personne qui signe le contrat et s'acquitte des cotisations.</li>
        <li><strong>Bénéficiaire :</strong> la personne désignée pour recevoir tout ou partie d'une prestation.</li>
        <li><strong>Cotisation :</strong> somme versée périodiquement (mensuelle, trimestrielle, annuelle) en contrepartie des garanties.</li>
        <li><strong>Sinistre :</strong> événement aléatoire couvert par le contrat entraînant la mise en œuvre des garanties.</li>
        <li><strong>Franchise :</strong> part du sinistre restant à la charge de l'assuré.</li>
        <li><strong>Plafond :</strong> montant maximum d'indemnisation par sinistre ou par année d'assurance.</li>
        <li><strong>Délai de carence :</strong> période suivant la souscription pendant laquelle certaines garanties ne sont pas encore mobilisables.</li>
      </ul>
    ),
  },
  {
    id: "souscription",
    title: "Souscription et prise d'effet",
    body: (
      <>
        <p>
          La souscription s'effectue en agence, dans un point de service partenaire ou en ligne via le présent site.
          Elle suppose la remise d'une <strong>pièce d'identité valide</strong>, le renseignement d'un
          <strong> questionnaire de souscription</strong> sincère et complet, et le règlement de la première cotisation.
        </p>
        <p>
          Le contrat prend effet à la date indiquée dans les Conditions Particulières, sous réserve de l'encaissement
          effectif de la première cotisation. Une <strong>attestation d'assurance</strong> et la Carte IPPOO sont
          remises à l'assuré dans un délai maximal de 7 jours ouvrés.
        </p>
      </>
    ),
  },
  {
    id: "carence",
    title: "Délais de carence",
    body: (
      <>
        <p>Des délais de carence peuvent s'appliquer selon la nature du risque couvert :</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Santé & Maladie :</strong> 30 jours pour les maladies courantes, 90 jours pour l'hospitalisation programmée, 10 mois pour la maternité.</li>
          <li><strong>Maternité :</strong> 10 mois calendaires à compter de la prise d'effet.</li>
          <li><strong>Marchandises, Équipement, Transport :</strong> 15 jours.</li>
          <li><strong>Retraite & Prévoyance vieillesse :</strong> selon le tableau d'évolution du capital prévu aux CP.</li>
        </ul>
        <p>Aucun délai de carence ne s'applique en cas d'accident.</p>
      </>
    ),
  },
  {
    id: "cotisations",
    title: "Cotisations",
    body: (
      <>
        <p>
          Les cotisations sont payables d'avance, selon la périodicité choisie. IPPOO ASSURANCE accepte le paiement
          par mobile money (Orange Money, Wave, MTN MoMo, Moov Money), par espèces auprès d'un point partenaire
          agréé, ou par virement bancaire.
        </p>
        <p>
          Le défaut de paiement d'une cotisation entraîne, après <strong>mise en demeure adressée par écrit ou SMS et
          observation d'un délai de 30 jours</strong>, la suspension des garanties puis, à défaut de régularisation,
          la résiliation du contrat dans les conditions fixées par le Code CIMA.
        </p>
      </>
    ),
  },
  {
    id: "exclusions",
    title: "Exclusions générales",
    body: (
      <>
        <p>Sauf stipulation contraire des Conditions Particulières, sont exclus de la garantie :</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>les sinistres résultant d'une faute intentionnelle ou dolosive de l'assuré ou du bénéficiaire ;</li>
          <li>les sinistres survenus alors que l'assuré était sous l'emprise d'alcool ou de stupéfiants ;</li>
          <li>les conséquences directes ou indirectes de guerre civile ou étrangère, d'émeutes, d'actes de terrorisme ou de réquisition par l'autorité publique ;</li>
          <li>les sinistres liés à des risques nucléaires ou à des catastrophes naturelles non spécifiquement garantis aux CP ;</li>
          <li>les pratiques sportives à risque non déclarées (pour les garanties santé et accident) ;</li>
          <li>les fausses déclarations intentionnelles à la souscription ou à la déclaration du sinistre.</li>
        </ul>
      </>
    ),
  },
  {
    id: "sinistre",
    title: "Déclaration et règlement des sinistres",
    body: (
      <>
        <p>
          L'assuré doit déclarer tout sinistre dans un délai de <strong>5 jours ouvrés</strong> à compter de sa
          survenance ou de sa connaissance, sauf en cas de vol (48 heures) ou de décès (15 jours). La déclaration
          peut être effectuée en ligne, par téléphone ou auprès d'un point de service partenaire.
        </p>
        <p>
          Pièces justificatives habituelles : pièce d'identité, contrat ou Carte IPPOO, justificatifs spécifiques au
          sinistre (certificat médical, procès-verbal de police, facture, devis). IPPOO ASSURANCE s'engage à
          indemniser le sinistre dans un délai maximal de <strong>15 jours ouvrés</strong> à compter de la réception
          du dossier complet, sous réserve de la réalité et de la couverture du sinistre.
        </p>
      </>
    ),
  },
  {
    id: "duree",
    title: "Durée, renouvellement et résiliation",
    body: (
      <>
        <p>
          Les contrats sont conclus pour une durée d'<strong>un an</strong>, renouvelable par <strong>tacite
          reconduction</strong> à chaque échéance principale, sauf dénonciation par l'une ou l'autre des parties
          adressée au moins 30 jours avant l'échéance par lettre recommandée, e-mail ou en agence.
        </p>
        <p>
          L'assuré dispose d'un droit de <strong>renonciation de 14 jours</strong> à compter de la souscription pour
          les contrats conclus à distance, avec remboursement intégral de la cotisation versée, déduction faite de
          la couverture éventuellement déjà mobilisée.
        </p>
      </>
    ),
  },
  {
    id: "reclamations",
    title: "Réclamations et médiation",
    body: (
      <p>
        En cas de désaccord, l'assuré adresse sa réclamation au service Relations Clients
        (<strong>contact@ippoo.bj</strong>). À défaut de réponse satisfaisante dans un délai de
        30 jours, il peut saisir gratuitement notre <strong>médiateur interne</strong>, puis, le cas échéant, le
        médiateur de la CIMA. La procédure complète est décrite sur la page
        <a className="text-[#0B6E4F] underline" href="/mediateur"> Médiation & réclamations</a>.
      </p>
    ),
  },
  {
    id: "droit",
    title: "Droit applicable",
    body: (
      <p>
        Le contrat est régi par le <strong>Code des Assurances CIMA</strong> et par les dispositions impératives du
        droit béninois. Tout litige relève des juridictions du ressort du siège social, sous réserve des modes
        amiables de règlement prévus ci-dessus.
      </p>
    ),
  },
];

export function ConditionsGeneralesPage() {
  return (
    <LegalPage
      title="Conditions générales"
      subtitle="Conditions générales applicables aux contrats de micro-assurance et d'assistance IPPOO ASSURANCE, conformes au Code des Assurances CIMA."
      lastUpdate="23 mai 2026"
      sections={sections}
      downloadLabel="Télécharger en PDF"
    />
  );
}
