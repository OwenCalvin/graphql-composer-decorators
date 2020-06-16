# Différence entre `gql-decorators` et `typegraphql`
Ce framework est basé sur le même principe que `typegraphql`, cependant il vient corriger et changer certains mode de fonctionnement qui peuvent être parfoit être restrictifs.

Le principal changement se trouvent dans le fait que ce module est séparé en deux modules distincts au lieu d'un seul plus lourd, ce qui permet également de vous fournir une API de composition nommée `graphql-composer`.  

Il y'a également des décorateurs supplémentaire tel que `@ObjectField` `@InputField` et `@InterfaceField`, qui permettent de parameter un champs pour un certains type GraphQL de la `class`.  

Il n'a pas de type `ArgsType` car n'existant pas dans GraphQL. Ceci peut donc se trouver être peu intuitif. En contre partie c'est du côté de la déclaration des arguments d'une query que on va pouvoir utiliser tout un type **input** pour déclarer l'ensemble des arguments avec le décorateur `@Args` (tout comme `ArgsType`):
```ts
@InputType()
class User {
  @Field()
  username: string;

  @Field()
  email: string;
}

@Resolver()
class Resolver {
  @Query()
  getUser(
    @Args()
    user: User
  ): Boolean {
  }
}
```
ce qui donne en SDL:
```graphql
input User {
  username: String
  email: String
}

type Query {
  getUser(username: String, email: String): Bool
}
```

La définition des type nullable et requis est très restrictive avec `typegraphql`, ce qui a été réglé ici grâce à deux fonctions: `Nullable(type: Type)` (`N(type: Type)`) et `Required(type: Type)` (`R(type: Type)`).
Prenons l'exemple de la déclaration d'un tableau avec un contenu interne requis (c'est en étant explicite, vous pouvez évidemment préciser si vos type sont nullable ou requis par défaut):
```ts
@InputType()
class User {
  @Field(type => [Required(String)])
  // or shorter with @Field(type => [R(String)])
  username: string[];

  @Field(type => Nullable([Required(String)]))
  // or shorter with @Field(type => N([R(String)]))
  email?: string[];
}
```
Il n'est pas possible de faire ceci avec `typegraphql` pour le moment car le paramètre nullable est appliquer à l'ensemble de `@Field`

Le décorateur de `@Subscription` fonctionne de manière différente, n'étant pas satisfait du fait d'imposer `grahphql-subcriptions` comme gestionnaire de subscriptions (le fonctionnement des subscription n'est donc pas très libre pour le développeur) et de ne pas laisser le choix au développeur, j'ai opté pour une manière un peu différente.
>Ces deux choix se défendent, mais je préfère être libre de gérer mon mécanisme de subscription via mon application, de plus que ça ne rajoute pas énormément de complexité

Avec `graphql-composer-decorators`
```ts
import { PubSub } from "graphql-subcriptions";

const pubsub = new PubSub();

@Resolver()
class Resolver {
  @Subscription({
    subscription: (args) => pubsub.asyncIterator("NOTIFICATION"),
  })
  mySubscription() {
    // ...
  }

  @Query()
  trigger(): Boolean {
    pubsub.publish("NOTIFICATION");
    // ...
  }
}
```

Avec `typegraphql`:
```ts
@Resolver()
class Resolver {
  @Subscription({
    topics: "NOTIFICATION"
  })
  mySubscription() {
    // ...
  }

  @Query()
  trigger(
    @PubSub()
    pubSub
  ): Boolean {
    pubsub.publish("NOTIFICATION");
    // ...
  }
}
```

Les arguments spécifiques au context GraphQL (infos, source, root, etc...) sont injectés via des décorateurs avec `typegraphql` (`@Root`, `@Source`, `@Infos`, ...) ce qui peut alourdir énormément la déclaration de vos méthodes. Ici nous avons opté l'injection d'un objet contenant l'ensemble de ces informations après vos arguments:
```ts
import { Context } from "graphql-composer";

@Resolver()
class Resolver {
  @Query()
  trigger(
    @Arg("username") username: string,
    context: Context, // Injected here (after all your arguments)
  ): Boolean {
    // ...
  }
}
```