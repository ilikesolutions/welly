import {UserPreferences} from "./UserPreferences.js";
import {sep} from "path";
import {proc} from "../lib/lib.js";
import templates from "./templates.js";
import {ensureDirSync} from "fs-extra";
import {rmSync} from "fs";
import {logger} from "../lib/logger.js";

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
            .then(() => spinner.succeed("Cloned successfully"))
            .catch(e => {
                spinner.fail("Clone failed");
                logger.error("Do you have git installed?" + JSON.stringify(e, undefined, 2), {kill: true});
            });
    }

    async init(): Promise<string> {
        await Builder.pullTemplate(this.userPreferences.projectDir, templates.core, "\"core\"");
        await this.setupIaC();

        return this.userPreferences.projectName;
    }

    async setupIaC(): Promise<void> {
        const iacDir = `${this.userPreferences.projectDir}${sep}${this.userPreferences.iacDir()}`;
        ensureDirSync(iacDir);
        await Builder.pullTemplate(iacDir, this.userPreferences.iacGit(), "for IaC");
    }

}