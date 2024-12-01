# Youtrack Sync Plugin for Obsidian

Upload notes to JetBrains YouTrack knowledge base articles (https://www.jetbrains.com/youtrack/download/get_youtrack.html)

Simple plugin for now; will publish to the obsidian community when it's feature complete.

## Features

- Upload note, creating new article
- Update article as needed

## Setup

1. Install the plugin
2. Generate a permanent token for your youtrack user (see: https://www.jetbrains.com/help/youtrack/devportal/Manage-Permanent-Token.html)
3. Set the token in the plugin settings
4. Set your endpoint in the plugin settings

## Uploading a note

Notes must have the following frontmatter to be synced:
```
youtrack-publish: true
youtrack-project: <projectShortName>
```

The project short name is the "ID" code for the project. By default, it's a 2-3 letter code but this 
can be changed in the youtrack project settings.

Once the article is created:

```
youtrack-id: <id>
```

will be added with the article id.

When you're ready to sync, activate the "sync current note" command.

## Roadmap

- 2-way sync (update obsidian note if youtrack article is newer)
- Automatic sync when file is saved
- Bulk sync of all marked notes in vault
- Attachment upload
- Visibility control
