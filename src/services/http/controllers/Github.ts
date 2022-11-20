import { Request, RequestHandler, Response, Router } from 'express';
import passport from 'passport';
import { Strategy as GhStrategy } from 'passport-github2';
import { calculateReputation, OAuthProvider } from '@interep/reputation';

import { Controller } from './interface';
import config from '../../../util/config';
import { getReceivedStars } from '../../../util/github';

type GhUser = {
  id: number;
  username: string;
  _json: {
    followers: number;
    plan: { name: string };
  };
};

export class GithubController extends Controller {
  redirectUrl: string;

  constructor() {
    super();
    passport.use(
      new GhStrategy(
        {
          clientID: config.ghClientId,
          clientSecret: config.ghClientSecret,
          callbackURL: config.ghCallbackUrl,
        },
        async (accessToken: string, refreshToken: string, profile: GhUser, done: any) => {
          const {
            id: userId,
            username,
            _json: {
              followers,
              plan: { name: planName },
            },
          } = profile;

          const proPlan = planName === 'pro';
          const receivedStars = await getReceivedStars(username);
          const reputation = calculateReputation(OAuthProvider.GITHUB, {
            followers,
            receivedStars,
            proPlan,
          });

          // TODO: need for github_auths DB operation here?
          // const githubAuthDB = await this.call('db', 'getGithubAuth');
          //
          // await githubAuthDB.upsertOne({
          //   userId,
          //   username,
          //   displayName,
          //   followers,
          //   proPlan,
          //   receivedStars,
          // });

          return done(null, {
            userId,
            username,
            reputation,
          });
        }
      )
    );

    this.addRoutes();
  }

  addRoutes = () => {
    this._router.use(
      '/auth/github',
      Router()
        .get(
          '',
          this.storeRedirectUrl,
          passport.authenticate('github', { scope: ['read:user', 'read:org'] })
        )
        .get('/callback', passport.authenticate('github'), this.callback)
        .get('/session', this.session)
    );
  };

  callback = (req: Request, res: Response) => {
    res.redirect(this.redirectUrl);
  };

  storeRedirectUrl: RequestHandler<{}, {}, {}, { redirectUrl: string }> = (req, res, next) => {
    this.redirectUrl = req.query.redirectUrl;
    next();
  };

  session = (req: Request, res: Response) => {
    if (req.user) {
      res.status(200).json({ payload: req.user });
    } else {
      res.status(401).json({ error: 'not authenticated' });
    }
  };
}
