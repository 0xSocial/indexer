import {GenericService} from "../../util/svc";
import {Dialect, Sequelize} from "sequelize";
import app from "../../models/app";
import config from "../../util/config";
import users from "../../models/users";
import records from "../../models/records";
import posts from "../../models/posts";
import meta from "../../models/meta";
import moderations from "../../models/moderations";
import profiles from "../../models/profiles";
import userMeta from "../../models/userMeta";
import connections from "../../models/connections";
import semaphore from "../../models/semaphore";
import proposalMeta from "../../models/proposalMeta";

export default class DBService extends GenericService {
    sequelize: Sequelize;
    sqlite: Sequelize;

    app?: ReturnType<typeof app>;
    users?: ReturnType<typeof users>;
    records?: ReturnType<typeof records>;
    posts?: ReturnType<typeof posts>;
    profiles?: ReturnType<typeof profiles>;
    moderations?: ReturnType<typeof moderations>;
    connections?: ReturnType<typeof connections>;
    semaphore?: ReturnType<typeof semaphore>;
    meta?: ReturnType<typeof meta>;
    userMeta?: ReturnType<typeof userMeta>;
    proposalMeta?: ReturnType<typeof proposalMeta>;

    constructor() {
        super();

        this.sqlite = new Sequelize({
            dialect: 'sqlite',
            storage: './gun.db',
            logging: false,
        });

        if (!config.dbDialect || config.dbDialect === 'sqlite') {
            this.sequelize = new Sequelize({
                dialect: 'sqlite',
                storage: config.dbStorage,
                logging: false,
            });
        } else {
            this.sequelize = new Sequelize(
                config.dbName as string,
                config.dbUsername as string,
                config.dbPassword,
                {
                    host: config.dbHost,
                    port: Number(config.dbPort),
                    dialect: config.dbDialect as Dialect,
                    logging: false,
                },
            );
        }
    }

    async getRecords(): Promise<ReturnType<typeof records>> {
        if (!this.records) {
            return Promise.reject(new Error('records is not initialized'));
        }
        return this.records;
    }

    async getUsers(): Promise<ReturnType<typeof users>> {
        if (!this.users) {
            return Promise.reject(new Error('users is not initialized'));
        }
        return this.users;
    }

    async getPosts(): Promise<ReturnType<typeof posts>> {
        if (!this.posts) {
            return Promise.reject(new Error('posts is not initialized'));
        }
        return this.posts;
    }

    async getConnections(): Promise<ReturnType<typeof connections>> {
        if (!this.connections) {
            return Promise.reject(new Error('connections is not initialized'));
        }
        return this.connections;
    }

    async getModerations(): Promise<ReturnType<typeof moderations>> {
        if (!this.moderations) {
            return Promise.reject(new Error('moderations is not initialized'));
        }
        return this.moderations;
    }

    async getProfiles(): Promise<ReturnType<typeof profiles>> {
        if (!this.profiles) {
            return Promise.reject(new Error('profiles is not initialized'));
        }

        return this.profiles;
    }

    async getMeta(): Promise<ReturnType<typeof meta>> {
        if (!this.meta) {
            return Promise.reject(new Error('meta is not initialized'));
        }

        return this.meta;
    }

    async getUserMeta(): Promise<ReturnType<typeof userMeta>> {
        if (!this.userMeta) {
            return Promise.reject(new Error('userMeta is not initialized'));
        }

        return this.userMeta;
    }

    async getProposalMeta(): Promise<ReturnType<typeof proposalMeta>> {
        if (!this.proposalMeta) {
            return Promise.reject(new Error('proposalMeta is not initialized'));
        }

        return this.proposalMeta;
    }

    async getApp(): Promise<ReturnType<typeof app>> {
        if (!this.app) {
            return Promise.reject(new Error('app is not initialized'));
        }
        return this.app;
    }

    async getSemaphore(): Promise<ReturnType<typeof semaphore>> {
        if (!this.semaphore) {
            return Promise.reject(new Error('semaphore is not initialized'));
        }
        return this.semaphore;
    }

    async start() {
        this.app = await app(this.sqlite);
        this.records = await records(this.sqlite);
        this.meta = await meta(this.sequelize);
        this.userMeta = await userMeta(this.sequelize);
        this.proposalMeta = await proposalMeta(this.sequelize);
        this.moderations = await moderations(this.sequelize);
        this.connections = await connections(this.sequelize);
        this.users = await users(this.sequelize);
        this.posts = await posts(this.sequelize);
        this.profiles = await profiles(this.sequelize);
        this.semaphore = await semaphore(this.sequelize);


        await this.app?.model.sync({ force: !!process.env.FORCE });
        await this.records?.model.sync({ force: !!process.env.FORCE });

        await this.semaphore?.model.sync({ force: !!process.env.FORCE });

        await this.users?.model.sync({ force: !!process.env.FORCE });
        await this.moderations?.model.sync({ force: !!process.env.FORCE });
        await this.connections?.model.sync({ force: !!process.env.FORCE });
        await this.profiles?.model.sync({ force: !!process.env.FORCE });
        await this.posts?.model.sync({ force: !!process.env.FORCE });

        await this.userMeta?.model.sync({ force: !!process.env.FORCE });
        await this.meta?.model.sync({ force: !!process.env.FORCE });
        await this.proposalMeta?.model.sync({ force: !!process.env.FORCE });

        const appData = await this.app?.read();

        if (!appData) {
            await this.app?.updateLastENSBlock(12957300);
        }
    }
}