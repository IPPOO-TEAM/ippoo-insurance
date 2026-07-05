import { createBrowserRouter, redirect } from "react-router";
import { Layout } from "./components/Layout";
import { HomePage } from "./components/HomePage";
import { ProductsPage } from "./components/ProductsPage";
import { ProductDetailPage } from "./components/ProductDetailPage";
import { CarteIppooPage } from "./components/CarteIppooPage";
import { CommentCaMarchePage } from "./components/CommentCaMarchePage";
import { PointsPartenairesPage } from "./components/PointsPartenairesPage";
import { FaqPage } from "./components/FaqPage";
import { ContactPage } from "./components/ContactPage";
import { MentionsLegalesPage } from "./components/MentionsLegalesPage";
import { ConfidentialitePage } from "./components/ConfidentialitePage";
import { ConditionsGeneralesPage } from "./components/ConditionsGeneralesPage";
import { MediateurPage } from "./components/MediateurPage";
import { DevisPage } from "./components/DevisPage";
import { SinistrePage } from "./components/SinistrePage";
import { AProposPage } from "./components/AProposPage";
import { InscriptionPage } from "./components/InscriptionPage";
import { StatutPage } from "./components/StatutPage";
import { HydrateFallback } from "./components/HydrateFallback";

import { EspaceLayout, EspacePublicLayout } from "./espace-client/EspaceLayout";
import { AdminLayout } from "./espace-client/AdminLayout";
import { ConnexionPage } from "./espace-client/pages/ConnexionPage";
import { DashboardPage } from "./espace-client/pages/DashboardPage";
import { ContratsPage } from "./espace-client/pages/ContratsPage";
import { SinistresPage } from "./espace-client/pages/SinistresPage";
import { CotisationsPage } from "./espace-client/pages/CotisationsPage";
import { ProfilPage } from "./espace-client/pages/ProfilPage";
import { BeneficiairesPage } from "./espace-client/pages/BeneficiairesPage";
import { DocumentsPage } from "./espace-client/pages/DocumentsPage";
import { MessageriePage } from "./espace-client/pages/MessageriePage";
import { NotificationsPage } from "./espace-client/pages/NotificationsPage";
import { SouscriptionPage } from "./espace-client/pages/SouscriptionPage";
import { CartePage } from "./espace-client/pages/CartePage";
import { ParametresPage } from "./espace-client/pages/ParametresPage";
import { OnboardingPage } from "./espace-client/pages/OnboardingPage";
import { IntroOnboardingPage } from "./espace-client/pages/IntroOnboardingPage";
import { PartenairesPage } from "./espace-client/pages/PartenairesPage";
import { KycPage } from "./espace-client/pages/KycPage";
import { AgentLayout } from "./agent/AgentLayout";
import { AgentInboxPage } from "./agent/pages/AgentInboxPage";
import { AgentDashboardPage } from "./agent/pages/AgentDashboardPage";
import { AgentTasksPage } from "./agent/pages/AgentTasksPage";
import { AgentProfilePage } from "./agent/pages/AgentProfilePage";
import { AgentClaimsPage } from "./agent/pages/AgentClaimsPage";
import { AgentCustomerPage } from "./agent/pages/AgentCustomerPage";
import { AgentKycPage } from "./agent/pages/AgentKycPage";
import { AgentPaymentsPage } from "./agent/pages/AgentPaymentsPage";
import { AgentPortfolioPage } from "./agent/pages/AgentPortfolioPage";
import { AgentTemplatesPage } from "./agent/pages/AgentTemplatesPage";
import { AgentSignupPage } from "./agent/pages/AgentSignupPage";
import { AgentLoginPage } from "./agent/pages/AgentLoginPage";
import { AgentPerformancePage } from "./agent/pages/AgentPerformancePage";
import {
  OverviewTab,
  ClaimsTab,
  MembersTab,
  ContractsTab,
  PaymentsTab,
  MessagesTab,
  BroadcastTab,
  PromosTab,
  TarifsTab,
  PartnersTab,
  SiteTab,
  AuditTab,
  AgentsTab,
  KycTab,
} from "./espace-client/pages/AdminPage";
import { SystemPage } from "./admin/pages/SystemPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    HydrateFallback,
    children: [
      { index: true, Component: HomePage },
      { path: "produits", Component: ProductsPage },
      { path: "produits/:slug", Component: ProductDetailPage },
      { path: "carte-ippoo", Component: CarteIppooPage },
      { path: "comment-ca-marche", Component: CommentCaMarchePage },
      { path: "points-partenaires", Component: PointsPartenairesPage },
      { path: "faq", Component: FaqPage },
      { path: "contact", Component: ContactPage },
      { path: "devis", Component: DevisPage },
      { path: "sinistre", Component: SinistrePage },
      // Ancienne page démo (données fictives) — redirigée vers le vrai espace
      // client pour qu'aucun utilisateur ne voie de données factices.
      { path: "espace", loader: () => { throw redirect("/espace-client"); } },
      { path: "a-propos", Component: AProposPage },
      { path: "inscription", Component: InscriptionPage },
      { path: "mentions-legales", Component: MentionsLegalesPage },
      { path: "confidentialite", Component: ConfidentialitePage },
      { path: "conditions-generales", Component: ConditionsGeneralesPage },
      { path: "mediateur", Component: MediateurPage },
      { path: "statut", Component: StatutPage },
      { path: "*", Component: HomePage },
    ],
  },
  {
    path: "/espace-client",
    HydrateFallback,
    Component: EspacePublicLayout,
    children: [
      { path: "decouverte", Component: IntroOnboardingPage },
      { path: "connexion", Component: ConnexionPage },
      { path: "inscription", loader: () => { throw redirect("/inscription"); } },
    ],
  },
  {
    path: "/espace-client",
    HydrateFallback,
    Component: EspaceLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: "contrats", Component: ContratsPage },
      { path: "sinistres", Component: SinistresPage },
      { path: "cotisations", Component: CotisationsPage },
      { path: "profil", Component: ProfilPage },
      { path: "beneficiaires", Component: BeneficiairesPage },
      { path: "documents", Component: DocumentsPage },
      { path: "messagerie", Component: MessageriePage },
      { path: "notifications", Component: NotificationsPage },
      { path: "souscription", Component: SouscriptionPage },
      { path: "carte", Component: CartePage },
      { path: "parametres", Component: ParametresPage },
      { path: "onboarding", Component: OnboardingPage },
      { path: "partenaires", Component: PartenairesPage },
      { path: "verification-identite", Component: KycPage },
    ],
  },
  {
    path: "/agent/inscription",
    HydrateFallback,
    Component: AgentSignupPage,
  },
  {
    path: "/agent/connexion",
    HydrateFallback,
    Component: AgentLoginPage,
  },
  {
    path: "/agent",
    HydrateFallback,
    Component: AgentLayout,
    children: [
      { index: true, Component: AgentDashboardPage },
      { path: "inbox", Component: AgentInboxPage },
      { path: "taches", Component: AgentTasksPage },
      { path: "profil", Component: AgentProfilePage },
      { path: "sinistres", Component: AgentClaimsPage },
      { path: "kyc", Component: AgentKycPage },
      { path: "paiements", Component: AgentPaymentsPage },
      { path: "portefeuille", Component: AgentPortfolioPage },
      { path: "modeles", Component: AgentTemplatesPage },
      { path: "performance", Component: AgentPerformancePage },
      { path: "clients/:uid", Component: AgentCustomerPage },
    ],
  },
  {
    path: "/admin",
    HydrateFallback,
    Component: AdminLayout,
    children: [
      { index: true, Component: OverviewTab },
      { path: "sinistres", Component: ClaimsTab },
      { path: "membres", Component: MembersTab },
      { path: "contrats", Component: ContractsTab },
      { path: "paiements", Component: PaymentsTab },
      { path: "messagerie", Component: MessagesTab },
      { path: "agents", Component: AgentsTab },
      { path: "kyc", Component: KycTab },
      { path: "diffusion", Component: BroadcastTab },
      { path: "carrousel", Component: PromosTab },
      { path: "tarifs", Component: TarifsTab },
      { path: "partenaires", Component: PartnersTab },
      { path: "contenu", Component: SiteTab },
      { path: "journal", Component: AuditTab },
      { path: "systeme", Component: SystemPage },
    ],
  },
]);
