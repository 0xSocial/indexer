import { BOOLEAN, INTEGER, Sequelize, STRING } from 'sequelize';

export type GithubAuthModel = {
  userId: string;
  username: string;
  displayName: string | null;
  followers: number;
  receivedStars: number;
  plan: boolean;
};

const githubAuth = (sequelize: Sequelize) => {
  const model = sequelize.define(
    'github_auth',
    {
      userId: { type: STRING },
      username: { type: STRING },
      displayName: { type: STRING },
      followers: { type: INTEGER },
      receivedStars: { type: INTEGER },
      plan: { type: BOOLEAN },
    },
    {
      indexes: [
        { unique: true, fields: ['userId'] },
        { unique: true, fields: ['username'] },
        { unique: true, fields: ['displayName'] },
      ],
    }
  );

  const findUserById = async (userId: string) =>
    (await model.findOne({ where: { userId } }))?.toJSON() as GithubAuthModel;
  const findUserByUserName = async (username: string) =>
    (await model.findOne({ where: { username } }))?.toJSON() as GithubAuthModel;
  const upsertOne = async (data: GithubAuthModel) => (await model.upsert(data))[0];

  return {
    model,
    findUserById,
    findUserByUserName,
    upsertOne,
  };
};

export default githubAuth;