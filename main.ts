import {
	App,
	Editor,
	getFrontMatterInfo,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab, request,
	Setting,
	TFile
} from 'obsidian';

interface YoutrackArticlePluginSettings {
	youtrackEndpoint: string;
	youtrackToken: string;
}

const DEFAULT_SETTINGS: YoutrackArticlePluginSettings = {
	youtrackEndpoint: 'https://example.youtrack.cloud',
	youtrackToken: ''
}

export default class YoutrackArticlePlugin extends Plugin {
	settings: YoutrackArticlePluginSettings;

	async onload() {
		await this.loadSettings();

		// Sync command
		this.addCommand({
			id: 'sync-current-youtrack-article',
			name: 'Sync current note',
			checkCallback: (checking: boolean) => {
				// Check for markdown view
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					if (!checking) {
						const file= this.app.workspace.getActiveFile();
						if (file) {
							this.syncFile(file);
						}
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new YoutrackArticleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async syncFile(file: TFile) {
		// Abort if no token set
		if (!this.settings.youtrackToken) {
			return;
		}

		// Do not sync files without explicit instructions in frontmatter
		let publishFlag: boolean = false;
		let publishId: string;
		let publishProject: string;
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (!!frontmatter?.['youtrack-publish']) {
				publishFlag = true;
				publishId = frontmatter['youtrack-id'];
				publishProject = frontmatter['youtrack-project'];
			}
		});

		if (publishFlag) {
			this.app.vault.cachedRead(file).then((data) => {
				const { frontmatter, contentStart, exists } = getFrontMatterInfo(data);
				const url = this.settings.youtrackEndpoint + "/api/articles" + (publishId ? '/' + publishId : '');
				const syncContents = data.slice(contentStart);
				request({
					contentType: 'application/json',
					headers: {
						'Authorization': "Bearer " + this.settings.youtrackToken
					},
					method: 'POST',
					url: url,
					body: JSON.stringify({
						"content": syncContents,
						"summary": file.basename,
						"project": {
							"shortName": publishProject,
						}
					}),
					throw: true,
				}).then((responseData) => {
					const response = JSON.parse(responseData);
					this.app.fileManager.processFrontMatter(file, (frontmatter) => {
						frontmatter["youtrack-id"] = response?.["id"];
					});
				});
			});
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class YoutrackArticleSettingTab extends PluginSettingTab {
	plugin: YoutrackArticlePlugin;

	constructor(app: App, plugin: YoutrackArticlePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('YouTrack Token')
			.setDesc('Permanent access token')
			.addText(text => text
				.setPlaceholder('Enter your token')
				.setValue(this.plugin.settings.youtrackToken)
				.onChange(async (value) => {
					this.plugin.settings.youtrackToken = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('YouTrack Endpoint')
			.setDesc('Endpoint for your YouTrack instance')
			.addText(text => text
				.setPlaceholder('Enter your endpoint')
				.setValue(this.plugin.settings.youtrackEndpoint)
				.onChange(async (value) => {
					this.plugin.settings.youtrackEndpoint = value;
					await this.plugin.saveSettings();
				}));
	}
}
