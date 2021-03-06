import {UserPreferences} from "./UserPreferences.js";
import {dirname, sep} from "path";
import {proc} from "../lib/lib.js";
import {copySync, ensureDirSync} from "fs-extra";
import {rmSync} from "fs";
import {logger} from "../lib/logger.js";
import {fileURLToPath} from "url";

export class Builder {
    private readonly userPreferences: UserPreferences;

    constructor(up: UserPreferences) {
        this.userPreferences = up;
    }

    private static async pullTemplate(cwd: string, git: string, logName: string): Promise<void> {
        const spinner = logger.loading(`Cloning template ${logName}`).start();

        await proc(`git clone ${git} .`, {cwd: cwd}).then(() => {
            rmSync(`${cwd}${sep}.git`, {force: true, recursive: true});
        })
            .then(() => spinner.succeed(`Cloned ${logName} successfully`))
            .catch(e => {
                spinner.fail("Clone failed");
                logger.error("Do you have git installed?" + JSON.stringify(e, undefined, 2), {kill: true});
            });
    }

    async init(): Promise<string> {
        this.copyCoreDir();
        await this.setupIaC();

        return this.userPreferences.projectName;
    }

    async setupIaC(): Promise<void> {
        const deployDir = `${this.userPreferences.projectDir}${sep}${this.userPreferences.deployDir()}`;
        ensureDirSync(deployDir);
        await Builder.pullTemplate(deployDir, this.userPreferences.iacGit(), "for IaC");
    }

    private copyCoreDir(): void {
        const __filename = fileURLToPath(import.meta.url);
        const dirName = dirname(__filename);
        const coreDir = `${dirName}${sep}..${sep}..${sep}core${sep}`;
        copySync(coreDir, this.userPreferences.projectDir);
    }

}