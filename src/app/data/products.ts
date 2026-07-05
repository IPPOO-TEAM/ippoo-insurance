import {
  productHeroSante, productHeroMarchandises, productHeroEquipement, productHeroTransport, productHeroMaternite, productHeroEducation, productHeroRetraite, productHeroSociale, productHeroJuridique, productHeroComptable, productHeroAdministrative,
} from "../lib/images";

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  category: "assurance" | "assistance";
  icon: string;
  color: string;
  colorLight: string;
  image: string;
  shortDescription: string;
  hero: {
    title: string;
    description: string;
  };
  sections: {
    title: string;
    content: string;
  }[];
  cta: {
    title: string;
    description: string;
  };
}

export const products: Product[] = [
  {
    id: "sante",
    slug: "sante-maladie",
    name: "Micro-Assurance Santé et Maladie",
    shortName: "Santé & Maladie",
    category: "assurance",
    icon: "Heart",
    color: "var(--ippoo-red)",
    colorLight: "var(--ippoo-red-light)",
    image: productHeroSante,
    shortDescription: "Une couverture santé pensée pour les travailleurs de l'informel : prise en charge des consultations, des médicaments essentiels et d'une partie des frais d'hospitalisation, avec un accompagnement préventif au plus près de votre quotidien.",
    hero: {
      title: "Micro-Assurance Santé et Maladie",
      description: "Quand on travaille dans le secteur informel, un simple épisode de maladie peut désorganiser toute une famille : journée d'activité perdue, médicaments à avancer, consultations reportées faute de moyens. La Micro-Assurance Santé et Maladie d'IPPOO ASSURANCE a été conçue pour transformer ce risque en une protection lisible et activable rapidement. Elle combine une prise en charge des dépenses médicales les plus fréquentes et un accompagnement préventif continu, afin que votre santé ne soit plus la première variable d'ajustement de votre budget."
    },
    sections: [
      {
        title: "Ce que la couverture prend en charge",
        content: "Elle vous aide à faire face aux dépenses de santé les plus fréquentes. La couverture prend en charge les consultations et rendez-vous médicaux, les médicaments de première nécessité et une partie des frais d'hospitalisation liés aux maladies courantes ou aux accidents légers."
      },
      {
        title: "Protection familiale",
        content: "Elle protège l'assuré principal et peut également s'étendre à un certain nombre de vos proches directs, notamment votre conjoint et les enfants. Vous bénéficiez ainsi d'un véritable filet de sécurité familial."
      },
      {
        title: "Pourquoi cette solution est différente",
        content: "Cette solution se distingue des assurances classiques par sa simplicité et sa vocation inclusive. Elle tient compte des risques réels auxquels sont exposés les travailleurs informels, comme la poussière, les intempéries, les petites blessures et les conditions de travail exigeantes. Notre mission est d'éviter qu'un problème de santé passager ne devienne une crise financière pour votre foyer."
      },
      {
        title: "Prévention et bien-être",
        content: "Au-delà des soins, le Micro-Assurance Santé et Maladie adopte une approche globale du bien-être, centrée sur la prévention. Chaque assuré accède à un accompagnement nutritionnel et diététique personnalisé, à des activités physiques adaptées, ainsi qu'à un suivi régulier d'indicateurs essentiels comme la tension, le poids, la glycémie et la fréquence cardiaque et bien d'autres encore. Cet accompagnement est mis en place avec l'appui de partenaires sanitaires communautaires, proches de nos bénéficiaires."
      }
    ],
    cta: {
      title: "Choisissez une protection qui vous suit dans la vraie vie.",
      description: "Découvrez la Micro-Assurance Santé et Maladie et obtenez une orientation rapide vers la formule la plus adaptée à votre situation."
    }
  },
  {
    id: "marchandises",
    slug: "marchandises",
    name: "Micro-Assurance Spécifique pour Marchandises",
    shortName: "Marchandises",
    category: "assurance",
    icon: "Package",
    color: "var(--ippoo-orange)",
    colorLight: "var(--ippoo-orange-light)",
    image: productHeroMarchandises,
    shortDescription: "Une protection ciblée pour les commerçants et vendeurs dont le stock constitue la principale source de revenus : vol, incendie, inondations saisonnières et détériorations naturelles sont couverts pour que vous puissiez reprendre l'activité sans repartir de zéro.",
    hero: {
      title: "Micro-Assurance Spécifique pour Marchandises",
      description: "Dans le commerce de proximité, votre stock n'est pas un poste comptable parmi d'autres : c'est votre capital de travail, celui qui finance la journée du lendemain. Un incendie sur l'étal, une inondation pendant la saison des pluies ou un vol nocturne peuvent réduire à néant des mois d'efforts en quelques heures. La Micro-Assurance Spécifique pour Marchandises d'IPPOO ASSURANCE a été conçue précisément pour ces situations. Elle indemnise les pertes les plus fréquentes du commerce informel et accompagne la reprise rapide de votre activité, avec des démarches simplifiées pensées pour des stocks modestes et parfois mobiles."
    },
    sections: [
      {
        title: "Ce qui est prévu",
        content: "Cette couverture prévoit une indemnisation en cas de vol sur le lieu de vente, d'incendie accidentel, d'inondation liée aux pluies saisonnières, ou encore de détérioration naturelle lorsque les conditions de conservation ne sont pas favorables."
      },
      {
        title: "Pour qui",
        content: "Elle s'adresse particulièrement aux commerçants de marché, aux vendeurs ambulants, aux petits grossistes et aux maraîchers, dont les marchandises sont souvent exposées et difficiles à sécuriser."
      },
      {
        title: "Approche IPPOO",
        content: "IPPOO ASSURANCE a conçu cette solution pour des stocks modestes et parfois mobiles. Les démarches sont simplifiées et l'accompagnement se fait au plus près de vous, afin d'éviter les procédures longues et les exigences réservées aux grandes entreprises. L'objectif est de transformer une perte potentiellement dévastatrice en une reprise plus rapide et plus stable."
      }
    ],
    cta: {
      title: "Protégez votre stock, protégez vos revenus.",
      description: "Contactez IPPOO ASSURANCE pour choisir la formule adaptée à votre type de marchandises et à votre activité."
    }
  },
  {
    id: "equipement",
    slug: "equipement-outillage",
    name: "Micro-Assurance Équipement et Outillage",
    shortName: "Équipement & Outillage",
    category: "assurance",
    icon: "Wrench",
    color: "var(--ippoo-blue)",
    colorLight: "var(--ippoo-blue-light)",
    image: productHeroEquipement,
    shortDescription: "Une couverture dédiée aux artisans et travailleurs indépendants : protégez vos outils contre le vol, la casse accidentelle et l'usure liée à un usage intensif, et bénéficiez d'un appui rapide pour la réparation ou le remplacement afin de limiter les jours d'arrêt.",
    hero: {
      title: "Micro-Assurance Équipement et Outillage",
      description: "Vos outils ne sont pas de simples objets : ils sont votre force de travail, votre capacité à honorer les commandes, à servir vos clients et à rentrer chaque soir avec un revenu. Lorsqu'un équipement disparaît, casse ou s'use prématurément, c'est toute votre activité qui ralentit, parfois pour plusieurs jours. La Micro-Assurance Équipement et Outillage d'IPPOO ASSURANCE protège ce qui vous permet de produire, réparer, construire ou cultiver. Elle facilite la réparation ou le remplacement de votre matériel pour que vous puissiez reprendre rapidement, sans entamer votre trésorerie ni perdre la confiance de vos clients."
    },
    sections: [
      {
        title: "Ce que la couverture protège",
        content: "Cette couverture intervient en cas de vol, de casse accidentelle ou d'usure prématurée liée à un usage intensif. Elle concerne aussi bien les petits outils que certains équipements indispensables, selon la formule retenue et la nature de votre activité. L'objectif est de faciliter la réparation ou le remplacement pour remettre votre travail en marche le plus rapidement possible."
      },
      {
        title: "Pour qui",
        content: "Elle est particulièrement utile aux mécaniciens, charpentiers, maçons, couturiers, menuisiers, soudeurs, agriculteurs et à tous les travailleurs indépendants qui dépendent de leurs outils pour gagner leur vie. Dans ces métiers, un seul outil manquant peut entraîner plusieurs jours d'arrêt, des clients perdus et des charges qui continuent."
      }
    ],
    cta: {
      title: "Protégez vos outils, protégez vos revenus.",
      description: "Contactez IPPOO ASSURANCE pour choisir la Micro-Assurance Équipement et Outillage adaptée à votre métier et sécuriser votre activité dès maintenant."
    }
  },
  {
    id: "transport",
    slug: "transport",
    name: "Micro-Assurance Transport",
    shortName: "Transport",
    category: "assurance",
    icon: "Truck",
    color: "var(--ippoo-blue)",
    colorLight: "var(--ippoo-blue-light)",
    image: productHeroTransport,
    shortDescription: "Une protection adaptée aux taxieurs, livreurs et conducteurs indépendants : motos, tricycles, charrettes ou vélos sont couverts contre les accidents légers, le vol et les pannes mécaniques, avec une assistance réactive pour reprendre la route au plus vite.",
    hero: {
      title: "Micro-Assurance Transport",
      description: "Quand votre véhicule est votre outil de travail, il devient aussi votre principal point de vulnérabilité : un accrochage sur une route encombrée, un vol près d'un marché ou une panne mécanique imprévue peut interrompre vos revenus du jour au lendemain. La Micro-Assurance Transport d'IPPOO ASSURANCE a été pensée pour les motos, tricycles, charrettes et vélos qui font vivre l'économie de proximité. Elle combine une couverture des aléas les plus fréquents et une assistance réactive sur le terrain, afin de limiter l'arrêt d'activité et de protéger durablement votre mobilité professionnelle."
    },
    sections: [
      {
        title: "Aléas couverts",
        content: "Cette couverture vous accompagne face aux aléas les plus fréquents. Elle peut intervenir en cas d'accident léger sur une route encombrée, de vol lorsque le véhicule est stationné près d'un marché, ou de panne mécanique imprévue liée à une utilisation intensive. L'objectif est de limiter l'arrêt d'activité et de vous aider à reprendre la route plus rapidement."
      },
      {
        title: "Pour qui",
        content: "Elle s'adresse particulièrement aux taxieurs, conducteurs indépendants, coursiers et livreurs qui vivent de leur mobilité et qui n'ont pas toujours accès aux solutions classiques réservées aux flottes ou aux grandes entreprises. IPPOO ASSURANCE propose une protection adaptée aux réalités du terrain, avec une assistance réactive et une indemnisation proportionnée."
      }
    ],
    cta: {
      title: "Protégez votre mobilité, protégez vos revenus.",
      description: "Contactez IPPOO ASSURANCE pour découvrir la Micro-Assurance Transport et choisir la formule la plus adaptée à votre activité."
    }
  },
  {
    id: "maternite",
    slug: "maternite",
    name: "Micro-Assurance Maternité",
    shortName: "Maternité",
    category: "assurance",
    icon: "Baby",
    color: "var(--ippoo-red)",
    colorLight: "var(--ippoo-red-light)",
    image: productHeroMaternite,
    shortDescription: "Un accompagnement complet de la grossesse à l'arrivée du bébé : consultations prénatales, accouchement sécurisé en centre partenaire, suivi post-partum et kit bébé pour les premiers jours, afin que la maternité reste un moment de joie et non une charge financière.",
    hero: {
      title: "Micro-Assurance Maternité",
      description: "La grossesse est un moment précieux dans la vie d'une famille, mais elle s'accompagne souvent d'inquiétudes très concrètes : coût des consultations, frais d'accouchement, dépenses des premières semaines. Pour les femmes qui travaillent dans l'informel et les foyers sans couverture sociale, ces dépenses peuvent peser lourd au pire moment. La Micro-Assurance Maternité d'IPPOO ASSURANCE a été conçue pour lever cette pression. Elle protège la future maman et le bébé à chaque étape clé du parcours, depuis le suivi prénatal jusqu'aux premiers jours de l'enfant, dans un cadre sécurisé et accessible."
    },
    sections: [
      {
        title: "Ce qui est couvert",
        content: "Elle couvre les consultations prénatales régulières afin de suivre l'évolution de la grossesse et de prévenir les complications. Elle prévoit également un accouchement sécurisé dans un centre de santé partenaire, ainsi que des consultations post-partum pour favoriser une récupération sereine et un bon démarrage pour le nouveau-né."
      },
      {
        title: "Kit bébé",
        content: "Pour aller plus loin, la couverture inclut aussi un kit bébé avec l'essentiel des premiers jours, notamment des couches, des vêtements et des produits d'hygiène. L'objectif est d'aider la famille à accueillir l'enfant dans de meilleures conditions, sans pression inutile."
      },
      {
        title: "Pour qui",
        content: "Cette micro-assurance s'adresse particulièrement aux femmes qui travaillent dans l'informel, aux familles sans couverture sociale et aux jeunes couples qui construisent leur foyer. Elle s'inspire de l'esprit d'entraide communautaire, en transformant la maternité en une période de confiance et de joie, plutôt qu'en risque financier."
      }
    ],
    cta: {
      title: "Préparez votre maternité avec sérénité.",
      description: "Contactez IPPOO ASSURANCE pour découvrir la formule Maternité et être orienté vers le parcours le plus adapté."
    }
  },
  {
    id: "education",
    slug: "education",
    name: "Micro-Assurance Éducation",
    shortName: "Éducation",
    category: "assurance",
    icon: "GraduationCap",
    color: "var(--ippoo-orange)",
    colorLight: "var(--ippoo-orange-light)",
    image: productHeroEducation,
    shortDescription: "Une protection conçue pour sécuriser la scolarité des enfants : prise en charge d'une partie des fournitures, des uniformes et des frais d'inscription, afin qu'un creux de trésorerie n'interrompe jamais leur parcours.",
    hero: {
      title: "Micro-Assurance Éducation",
      description: "L'école ne devrait jamais être un luxe, mais pour les familles dont les revenus dépendent du quotidien, chaque rentrée scolaire devient une épreuve qui met le budget sous tension. Manuels, uniformes, fournitures, frais d'inscription : la facture tombe en une seule fois, au moment où les recettes ne suivent pas toujours. La Micro-Assurance Éducation d'IPPOO ASSURANCE répond à cette réalité. Elle prend en charge une partie des dépenses scolaires essentielles, de sorte qu'un enfant ne soit jamais retiré des cours faute de moyens et que les efforts des parents construisent durablement l'avenir du foyer."
    },
    sections: [
      {
        title: "Dépenses prises en charge",
        content: "Cette solution prend en charge une partie des dépenses scolaires essentielles. Elle peut couvrir les fournitures de base comme les cahiers, stylos et manuels, ainsi que les uniformes et certains frais d'inscription annuels, selon la formule choisie. L'objectif est simple, éviter qu'un enfant manque l'école ou soit retiré des cours faute de moyens au mauvais moment."
      },
      {
        title: "Pour qui",
        content: "La Micro-Assurance Éducation a été conçue pour les parents qui se battent chaque jour pour faire vivre leur foyer. Elle soutient directement l'avenir des enfants et contribue à réduire le risque de décrochage scolaire, afin que les efforts d'aujourd'hui ouvrent de vraies opportunités demain."
      }
    ],
    cta: {
      title: "Investissez dans l'avenir de vos enfants dès maintenant.",
      description: "Contactez IPPOO ASSURANCE pour découvrir la Micro-Assurance Éducation et choisir la formule la plus adaptée à votre famille."
    }
  },
  {
    id: "retraite",
    slug: "retraite-prevoyance",
    name: "Micro-Assurance Retraite et Prévoyance Vieillesse",
    shortName: "Retraite & Prévoyance",
    category: "assurance",
    icon: "Landmark",
    color: "var(--ippoo-green)",
    colorLight: "var(--ippoo-green-light)",
    image: productHeroRetraite,
    shortDescription: "Une solution d'épargne longue durée pensée pour les travailleurs sans régime formel : constituez un capital à votre rythme, qui se transformera en revenu régulier au moment de la retraite et protégera votre autonomie.",
    hero: {
      title: "Micro-Assurance Retraite et Prévoyance Vieillesse",
      description: "Travailler toute une vie sans préparer les années qui suivent, c'est s'exposer à dépendre des autres au moment où l'on a le plus besoin de stabilité. Pour les artisans, commerçants, agriculteurs et transporteurs qui n'ont jamais cotisé à un régime formel, la vieillesse peut devenir une source d'angoisse plus qu'un repos mérité. La Micro-Assurance Retraite et Prévoyance Vieillesse d'IPPOO ASSURANCE répond à ce besoin en s'inspirant de la discipline des systèmes d'épargne communautaires, dans un cadre plus sécurisé et plus lisible. Vous épargnez progressivement, à votre rythme, et vous construisez un capital qui se transformera en revenu régulier au moment voulu, pour aborder l'avenir avec dignité et sérénité."
    },
    sections: [
      {
        title: "Le principe",
        content: "Le principe est de vous permettre de constituer une épargne au fil du temps, à votre rythme, afin de bâtir un capital qui évolue et qui peut ensuite se transformer en revenu régulier à partir d'un âge défini. Vous construisez ainsi une pension adaptée à votre parcours, même si vous n'avez jamais bénéficié d'un régime de retraite formel."
      },
      {
        title: "Pour qui",
        content: "Cette micro-assurance s'adresse en priorité aux artisans, commerçants, agriculteurs, transporteurs et travailleurs indépendants, notamment les seniors qui ont porté leur famille pendant des années sans filet social. Elle s'inspire de la discipline des systèmes d'épargne communautaires, tout en apportant un cadre plus sécurisé et une projection claire sur le long terme."
      },
      {
        title: "Objectif",
        content: "L'objectif est de remplacer l'incertitude de la vieillesse par une perspective plus sereine. Vous préparez vos années futures, vous protégez votre dignité et vous réduisez la charge financière qui pèse souvent sur les enfants et les proches."
      }
    ],
    cta: {
      title: "Commencez dès maintenant à construire votre retraite.",
      description: "Contactez IPPOO ASSURANCE pour choisir une formule de prévoyance vieillesse adaptée à votre activité et à vos objectifs."
    }
  },
  {
    id: "sociale",
    slug: "sociale-responsabilite-civile",
    name: "Micro-Assurance Sociale et Responsabilité Civile",
    shortName: "Sociale & RC",
    category: "assurance",
    icon: "Shield",
    color: "var(--ippoo-green)",
    colorLight: "var(--ippoo-green-light)",
    image: productHeroSociale,
    shortDescription: "Une double protection au cœur de la vie communautaire : indemnité funéraire mobilisable rapidement en cas de décès ou d'invalidité, et responsabilité civile pour couvrir les dommages involontaires causés dans le cadre de votre activité.",
    hero: {
      title: "Micro-Assurance Sociale et Responsabilité Civile",
      description: "La vie en communauté repose sur la solidarité, mais elle expose aussi à des imprévus capables de bouleverser l'équilibre d'un foyer du jour au lendemain : un deuil à honorer, une invalidité qui prive de revenus, ou simplement un incident du quotidien qui engage votre responsabilité auprès d'un tiers. La Micro-Assurance Sociale et Responsabilité Civile d'IPPOO ASSURANCE combine deux protections complémentaires. La première apporte un soutien financier rapide en cas d'événement grave touchant la famille. La seconde évite qu'un dommage involontaire ne dégénère en conflit lourd ou en perte financière difficile à supporter pour une activité informelle."
    },
    sections: [
      {
        title: "Événements graves",
        content: "Cette couverture intervient lors d'événements graves comme le décès ou l'invalidité d'un membre de la famille. Elle prévoit une indemnité funéraire disponible rapidement afin de permettre à la famille d'honorer les rites et les obligations sociales, sans mettre en péril les dépenses essentielles du ménage."
      },
      {
        title: "Responsabilité civile",
        content: "Elle intègre également une responsabilité civile adaptée aux réalités des activités informelles. Si, par inadvertance, vous causez un dommage à une autre personne, par exemple lors d'une activité de vente ou de transport, l'assurance contribue à régler la situation avec une protection simple, proportionnée et utile. L'objectif est d'éviter qu'un incident du quotidien ne se transforme en conflit lourd ou en perte financière difficile à supporter."
      },
      {
        title: "Approche",
        content: "Pensée pour les artisans, commerçants et familles à revenus modeste, cette micro-assurance s'inspire des mécanismes de solidarité communautaire. Elle peut être mise en place en groupe ou à titre individuel, avec un accompagnement de proximité et une prise en charge claire quand vous en avez besoin."
      }
    ],
    cta: {
      title: "Protégez votre famille et votre réputation avec une solution faite pour votre réalité.",
      description: "Contactez-nous pour découvrir la formule sociale et responsabilité civile qui vous convient et activer votre protection en toute simplicité."
    }
  },
  {
    id: "juridique",
    slug: "juridique",
    name: "Micro-Assurance Juridique",
    shortName: "Juridique",
    category: "assistance",
    icon: "Scale",
    color: "var(--ippoo-blue)",
    colorLight: "var(--ippoo-blue-light)",
    image: productHeroJuridique,
    shortDescription: "Un accès simplifié au conseil juridique : avocats partenaires habitués au terrain, orientation rapide sur vos droits, et prise en charge possible des frais essentiels pour résoudre les petits litiges qui menacent votre activité.",
    hero: {
      title: "Micro-Assurance Juridique",
      description: "Dans le secteur informel, un simple désaccord peut vite se transformer en problème sérieux : une dette qui traîne, un accord verbal mal interprété, un conflit autour d'un étal de marché ou d'un petit terrain peuvent bloquer une activité pendant des semaines et menacer des années d'économies. La Micro-Assurance Juridique d'IPPOO ASSURANCE vous donne accès à des conseils clairs et à un appui concret pour défendre vos droits, sans jargon ni circuit judiciaire intimidant. Elle privilégie la prévention, la médiation et la résolution rapide, pour que vous puissiez vous concentrer sur votre travail plutôt que sur vos litiges."
    },
    sections: [
      {
        title: "Conseils juridiques",
        content: "Cette solution vous donne accès à des conseils juridiques clairs, délivrés par des avocats partenaires habitués aux réalités du terrain et aux situations du quotidien. Vous obtenez rapidement une orientation sur la démarche à suivre, les preuves à rassembler et la meilleure option pour protéger vos intérêts."
      },
      {
        title: "Frais juridiques",
        content: "Lorsque le dossier l'exige, la micro-assurance peut aussi contribuer à la prise en charge des frais juridiques essentiels liés aux procédures locales, afin que le manque de moyens ne vous empêche pas d'agir. L'objectif est de vous offrir une protection utile et proportionnée, adaptée aux petits litiges qui peuvent coûter très cher quand ils s'enveniment."
      },
      {
        title: "Approche pratique",
        content: "Parce que beaucoup d'entrepreneurs n'ont ni le temps ni l'accès facile aux circuits judiciaires classiques, cette couverture privilégie une approche pratique et rapide. Elle s'appuie sur l'esprit des médiations communautaires, en favorisant la recherche de solutions, la prévention des conflits et la sécurisation de vos relations d'affaires."
      }
    ],
    cta: {
      title: "Sécurisez votre activité et vos revenus.",
      description: "Contactez IPPOO ASSURANCE pour découvrir la Micro-Assurance Juridique et obtenir une première orientation adaptée à votre situation."
    }
  },
  {
    id: "comptable",
    slug: "comptable-fiscale",
    name: "Micro-Assurance Comptable et Fiscale",
    shortName: "Comptable & Fiscale",
    category: "assistance",
    icon: "Calculator",
    color: "var(--ippoo-orange)",
    colorLight: "var(--ippoo-orange-light)",
    image: productHeroComptable,
    shortDescription: "Un accompagnement comptable et fiscal simplifié pour les entrepreneurs informels : organisation des recettes et dépenses, conseils personnalisés sur vos obligations locales, et appui aux déclarations pour éviter les erreurs et les amendes.",
    hero: {
      title: "Micro-Assurance Comptable et Fiscale",
      description: "Quand on travaille avec des revenus variables et sans outils sophistiqués, la comptabilité et les obligations fiscales se transforment vite en source de stress : recettes mal suivies, dépenses oubliées, déclarations mal comprises, sanctions évitables. La Micro-Assurance Comptable et Fiscale d'IPPOO ASSURANCE vous aide à reprendre le contrôle, étape par étape. Elle combine un accompagnement de proximité, des conseils personnalisés sans jargon et une assistance aux démarches déclaratives simplifiées, afin que votre gestion devienne un levier de croissance plutôt qu'une contrainte permanente."
    },
    sections: [
      {
        title: "Accompagnement",
        content: "Cette solution vous apporte un accompagnement simple et concret pour organiser vos informations de base, notamment le suivi des recettes et des dépenses. Vous bénéficiez également de conseils personnalisés pour comprendre ce qui est attendu par les autorités locales, sans jargon et sans complexité."
      },
      {
        title: "Démarches déclaratives",
        content: "La couverture inclut une assistance pour préparer et réaliser les démarches déclaratives simplifiées lorsque cela s'applique. Elle vise surtout à réduire les risques d'erreurs, de retards et d'amendes liées à une mauvaise compréhension des règles. Vous êtes ainsi mieux préparé en cas de contrôle et mieux outillé pour protéger vos gains."
      },
      {
        title: "Pour qui",
        content: "Cette micro-assurance convient particulièrement aux entrepreneurs informels en phase d'évolution, comme les tailleurs, vendeurs, prestataires et petits commerçants qui travaillent sans outils sophistiqués, mais qui veulent progresser. L'accompagnement peut se faire au plus près de vous, avec des agents mobiles ou via une application intuitive, selon votre contexte."
      }
    ],
    cta: {
      title: "Faites de la gestion un avantage, pas une contrainte.",
      description: "Contactez IPPOO ASSURANCE pour découvrir la Micro-Assurance Comptable et Fiscale et bénéficier d'un accompagnement adapté à votre activité."
    }
  },
  {
    id: "administrative",
    slug: "administrative",
    name: "Micro-Assurance Administrative",
    shortName: "Administrative",
    category: "assistance",
    icon: "FileText",
    color: "var(--ippoo-green)",
    colorLight: "var(--ippoo-green-light)",
    image: productHeroAdministrative,
    shortDescription: "Un appui de terrain pour vos démarches administratives : renouvellement de pièces, dossiers de domiciliation, autorisations professionnelles vous êtes guidé pas à pas pour réduire les blocages, les allers-retours et les délais.",
    hero: {
      title: "Micro-Assurance Administrative",
      description: "Les démarches administratives sont une charge invisible mais bien réelle pour les travailleurs informels : files d'attente, formulaires obscurs, allers-retours sans fin, pièces manquantes qui finissent par bloquer une activité ou engendrer des dépenses imprévues. La Micro-Assurance Administrative d'IPPOO ASSURANCE a été conçue pour absorber cette complexité à votre place. Elle vous accompagne dans les formalités courantes, depuis le renouvellement d'une pièce essentielle jusqu'à l'obtention d'une autorisation professionnelle, avec un appui de proximité qui privilégie la simplicité, la rapidité et la finalisation effective de vos dossiers."
    },
    sections: [
      {
        title: "Assistance dédiée",
        content: "Cette solution vous apporte une assistance dédiée pour les formalités courantes. Elle peut vous aider pour le renouvellement de pièces essentielles comme la carte d'identité ou certains permis, pour constituer un dossier de domiciliation utile à vos projets, ou encore pour obtenir des autorisations nécessaires à vos déplacements professionnels selon les règles locales."
      },
      {
        title: "Pour qui",
        content: "Elle s'adresse particulièrement aux professionnels qui subissent des blocages répétés. Elle est utile aux transporteurs confrontés à des contrôles, aux vendeurs de marché qui doivent régulariser une autorisation d'étal, aux agriculteurs en attente de documents liés au foncier, ainsi qu'aux commerçants et producteurs découragés par des formulaires et des procédures longues."
      },
      {
        title: "Approche",
        content: "L'approche privilégie la simplicité et la proximité. Vous êtes guidé pas à pas, avec des solutions pratiques accessibles sur le terrain, pour réduire les retards, limiter les allers-retours et accélérer la finalisation des dossiers."
      }
    ],
    cta: {
      title: "Gagnez du temps et avancez sans stress.",
      description: "Contactez IPPOO ASSURANCE pour activer votre Micro-Assurance Administrative et vous faire accompagner dans vos démarches, en toute simplicité."
    }
  }
];

export const faqData = [
  {
    question: "À qui s'adressent les offres IPPOO ASSURANCE ?",
    answer: "Nos offres s'adressent en priorité aux femmes et aux hommes qui font vivre l'économie de proximité : artisans, commerçants de marché, vendeurs ambulants, agriculteurs, transporteurs, prestataires et travailleurs indépendants. Plus largement, IPPOO ASSURANCE s'adresse à toute personne active dans le secteur informel qui n'a pas accès aux solutions classiques réservées aux salariés ou aux grandes entreprises, et qui souhaite construire une protection adaptée à la réalité de son métier."
  },
  {
    question: "Pourquoi IPPOO ASSURANCE est adapté au secteur informel ?",
    answer: "Parce que nos solutions ont été conçues depuis le terrain, pas adaptées à la marge. Concrètement, cela signifie des démarches simplifiées, un langage clair sans jargon, des montants ajustés à des revenus parfois irréguliers, des points de service partenaires implantés près de chez vous, et une prise en charge déclenchée rapidement lorsqu'un incident survient. Notre objectif est qu'un imprévu n'oblige jamais un foyer à arbitrer entre soigner un enfant, garder un stock ou nourrir la famille."
  },
  {
    question: "Quels types de risques sont couverts par vos produits ?",
    answer: "Chaque produit IPPOO ASSURANCE répond à un risque concret rencontré au quotidien dans l'informel. Côté assurances, nous couvrons la santé et la maladie, la maternité, l'éducation des enfants, les marchandises, les équipements et outillages, les moyens de transport, la retraite et la prévoyance vieillesse, ainsi que les responsabilités sociales et civiles. Côté assistance, nous proposons un appui juridique, comptable et fiscal, et administratif. Ensemble, ces produits forment une protection cohérente couvrant la personne, la famille, l'outil de travail et le cadre légal de l'activité."
  },
  {
    question: "Comment choisir la bonne micro-assurance ?",
    answer: "Le bon choix dépend de trois éléments : votre métier, les risques auxquels vous êtes le plus exposé, et la capacité d'épargne que vous pouvez mobiliser régulièrement. Vous pouvez démarrer par la protection la plus critique (souvent la santé, le stock ou l'outil de travail) puis enrichir progressivement votre couverture. Pour être guidé, contactez IPPOO ASSURANCE ou rendez-vous dans un point de service partenaire : un conseiller analysera votre situation et vous orientera vers la formule la plus adaptée."
  },
  {
    question: "Comment souscrire ?",
    answer: "La souscription est volontairement rapide et sans complexité. Vous pouvez nous contacter directement, passer par notre site, ou vous rendre dans l'un de nos points de service partenaires. Un conseiller vous accompagne pour comprendre votre besoin, choisir la formule adaptée, finaliser les formalités essentielles et activer votre protection. Aucune connaissance technique n'est requise : nous prenons le temps de tout expliquer pas à pas."
  },
  {
    question: "Est-ce que l'accompagnement est disponible près de chez moi ?",
    answer: "Oui. IPPOO ASSURANCE s'appuie sur un réseau de partenaires locaux de confiance et de points de service partenaires implantés au cœur des marchés, des gares routières et des quartiers d'activité. Cette présence de terrain garantit que vous puissiez poser vos questions, souscrire ou activer une prise en charge sans avoir à parcourir de longues distances ni dépendre exclusivement de canaux numériques."
  },
  {
    question: "En cas de besoin, la prise en charge est-elle rapide ?",
    answer: "Oui, la rapidité est au cœur de notre engagement. Nos parcours d'indemnisation et d'assistance ont été simplifiés pour vous permettre de signaler un incident en quelques étapes et obtenir une réponse dans les meilleurs délais. L'objectif est qu'un sinistre, un soin urgent ou un blocage administratif ne fragilise pas durablement votre activité ou votre foyer, et que vous puissiez reprendre votre travail aussi vite que possible."
  },
  {
    question: "La Micro-Assurance Santé et Maladie couvre-t-elle seulement l'assuré principal ?",
    answer: "Elle protège l'assuré principal et peut également s'étendre à un certain nombre de vos proches directs, notamment votre conjoint et les enfants, selon la formule."
  },
  {
    question: "Que prend en charge la Micro-Assurance Santé et Maladie ?",
    answer: "Elle aide à faire face aux dépenses de santé les plus fréquentes : consultations et rendez-vous médicaux, médicaments de première nécessité, et une partie des frais d'hospitalisation liés aux maladies courantes ou aux accidents légers."
  },
  {
    question: "La Micro-Assurance Santé et Maladie propose-t-elle aussi de la prévention ?",
    answer: "Oui. Elle adopte une approche globale du bien-être centrée sur la prévention : accompagnement nutritionnel et diététique personnalisé, activités physiques adaptées, suivi régulier d'indicateurs essentiels (tension, poids, glycémie, fréquence cardiaque, et bien d'autres). Cet accompagnement est mis en place avec l'appui de partenaires sanitaires communautaires."
  },
  {
    question: "Que couvre la Micro-Assurance Spécifique pour Marchandises ?",
    answer: "Elle prévoit une indemnisation en cas de vol sur le lieu de vente, d'incendie accidentel, d'inondation liée aux pluies saisonnières, ou encore de détérioration naturelle lorsque les conditions de conservation ne sont pas favorables."
  },
  {
    question: "À qui s'adresse la Micro-Assurance Marchandises ?",
    answer: "Elle s'adresse particulièrement aux commerçants de marché, vendeurs ambulants, petits grossistes et maraîchers, dont les marchandises sont souvent exposées et difficiles à sécuriser. Elle a été conçue pour des stocks modestes et parfois mobiles."
  },
  {
    question: "Que couvre la Micro-Assurance Équipement et Outillage ?",
    answer: "Elle intervient en cas de vol, de casse accidentelle ou d'usure prématurée liée à un usage intensif. Elle concerne petits outils et certains équipements indispensables, selon la formule retenue et la nature de votre activité."
  },
  {
    question: "À qui s'adresse la Micro-Assurance Équipement et Outillage ?",
    answer: "Elle est particulièrement utile aux mécaniciens, charpentiers, maçons, couturiers, menuisiers, soudeurs, agriculteurs et à tous les travailleurs indépendants qui dépendent de leurs outils pour gagner leur vie."
  },
  {
    question: "Comment fonctionne la Micro-Assurance Retraite et Prévoyance Vieillesse ?",
    answer: "Elle vous permet de constituer une épargne au fil du temps, à votre rythme, afin de bâtir un capital qui évolue et qui peut ensuite se transformer en revenu régulier à partir d'un âge défini. Elle s'adresse notamment à ceux qui n'ont jamais bénéficié d'un régime de retraite formel."
  },
  {
    question: "Que couvre la Micro-Assurance Sociale et Responsabilité Civile ?",
    answer: "Elle intervient lors d'événements graves comme le décès ou l'invalidité d'un membre de la famille, avec une indemnité funéraire disponible rapidement. Elle intègre aussi une responsabilité civile adaptée aux réalités des activités informelles."
  },
  {
    question: "Que propose la Micro-Assurance Juridique ?",
    answer: "Elle donne accès à des conseils juridiques clairs délivrés par des avocats partenaires habitués aux réalités du terrain, avec une orientation rapide sur les démarches à suivre, les preuves à rassembler et la meilleure option pour protéger vos intérêts."
  },
  {
    question: "Que propose la Micro-Assurance Comptable et Fiscale ?",
    answer: "Elle apporte un accompagnement simple et concret pour organiser les informations de base (suivi recettes/dépenses) et des conseils personnalisés pour comprendre les obligations locales."
  },
  {
    question: "Que propose la Micro-Assurance Administrative ?",
    answer: "Elle accompagne les démarches administratives courantes : renouvellement de pièces essentielles, constitution d'un dossier de domiciliation, obtention d'autorisations nécessaires à certains déplacements professionnels selon les règles locales."
  },
  {
    question: "Que couvre la Micro-Assurance Maternité ?",
    answer: "Elle couvre les consultations prénatales régulières, un accouchement sécurisé dans un centre de santé partenaire, ainsi que des consultations post-partum. Elle inclut aussi un kit bébé avec l'essentiel des premiers jours."
  },
  {
    question: "Que couvre la Micro-Assurance Éducation ?",
    answer: "Elle prend en charge une partie des dépenses scolaires essentielles : fournitures de base (cahiers, stylos, manuels), uniformes, et certains frais d'inscription annuels, selon la formule choisie."
  },
  {
    question: "Que couvre la Micro-Assurance Transport ?",
    answer: "Elle protège les moyens de transport utilisés dans l'activité informelle (motos, tricycles, charrettes, vélos). Elle peut intervenir en cas d'accident léger, de vol ou de panne mécanique imprévue."
  },
  {
    question: "Qu'est-ce que la Carte IPPOO ?",
    answer: "La Carte IPPOO s'inscrit dans l'approche IPPOO ASSURANCE : proximité, simplicité, parcours clair du début à la fin, et appui de partenaires locaux de confiance. Elle est conçue pour faciliter l'accès à votre protection et à l'accompagnement."
  },
  {
    question: "Comment obtenir une orientation ou démarrer ma protection ?",
    answer: "Contactez IPPOO ASSURANCE ou rendez-vous auprès de nos points de service partenaires pour être orienté et démarrer votre protection en toute simplicité."
  }
];

export const partnerPoints = [
  { name: "Point IPPOO Marché Central", zone: "Cotonou", address: "Marché de Dantokpa, Stand 45", phone: "+229 07 00 00 01" },
  { name: "Point IPPOO Akpakpa", zone: "Cotonou", address: "Gare routière d'Akpakpa, Bureau 12", phone: "+229 07 00 00 02" },
  { name: "Point IPPOO Cadjehoun", zone: "Cotonou", address: "Carrefour Siporex, Local 8", phone: "+229 07 00 00 03" },
  { name: "Point IPPOO Haie Vive", zone: "Cotonou", address: "Haie Vive, Immeuble IPPOO", phone: "+229 07 00 00 04" },
  { name: "Point IPPOO Parakou", zone: "Parakou", address: "Quartier Commerce, Face au Grand Marché", phone: "+229 07 00 00 05" },
  { name: "Point IPPOO Natitingou", zone: "Natitingou", address: "Avenue des Artisans, Local 3", phone: "+229 07 00 00 06" },
  { name: "Point IPPOO Ouidah", zone: "Ouidah", address: "Boulevard du Port, Bureau 7", phone: "+229 07 00 00 07" },
  { name: "Point IPPOO Porto-Novo", zone: "Porto-Novo", address: "Quartier Habitat, Rue des Services", phone: "+229 07 00 00 08" },
  { name: "Point IPPOO Bohicon", zone: "Bohicon", address: "Centre-ville, Carrefour Jean-Paul II", phone: "+229 07 00 00 09" },
  { name: "Point IPPOO Djougou", zone: "Djougou", address: "Marché Principal, Entrée Est", phone: "+229 07 00 00 10" },
];
