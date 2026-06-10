# Auth & comptes — S1-4 (RopaNova Mobile)

## Ce qui est couvert dans l’app

| Parcours | Où | Détail |
|----------|-----|--------|
| Session | `AuthContext` | `onAuthStateChanged` : profil chargé depuis Firestore après connexion. |
| Déconnexion | Profil → Configuración de cuenta → Cerrar sesión | `signOut` Firebase + retour flux login (via `isAuthenticated`). |
| Mot de passe oublié | Écran login → « ¿Olvidaste tu contraseña? » | `sendPasswordResetEmail` sur l’email saisi. Vérifier spam ; domaine auth Firebase doit autoriser l’envoi. |
| Changement de mot de passe | Seguridad → Cambiar Contraseña (écran `PrivacySettings`) | Réauthentification + `updatePassword` (compte email/mot de passe uniquement). |
| Suppression de compte | Configuración de cuenta → Eliminar cuenta | Réauthentification + `deleteUser` (Auth). Les données Firestore / Storage peuvent rester : traitement séparé ou support manuel. |

## Support (réponses courtes)

- **Je ne reçois pas le mail de reset** : vérifier l’adresse, dossier spam, et dans Firebase Console → Authentication → Models / fournisseur email. Pour la prod, configurer le domaine et les quotas d’envoi.
- **« Erreur » au changement de mot de passe** : souvent mauvais mot de passe actuel, ou session trop ancienne → se déconnecter, se reconnecter, réessayer.
- **Suppression : erreur après avoir tapé le mot de passe** : même cause (reconnexion). Après succès, l’utilisateur ne peut plus se connecter avec cet email tant qu’il n’est pas recréé.
- **Données encore visibles après suppression Auth** : normal tant qu’il n’y a pas de job serveur (Cloud Function / admin) pour purger `users/{id}`, produits, favoris, etc. — à traiter au niveau produit / juridique (RGPD).

## Persistance de session (mobile)

L’app utilise `getAuth` (SDK Firebase JS). Le comportement exact de persistance sur iOS/Android peut dépendre de la version du SDK Expo ; si des déconnexions intempestives au redémarrage apparaissent, prévoir `initializeAuth` + persistance AsyncStorage lorsque l’équipe aligne la version Firebase / les types du SDK.
