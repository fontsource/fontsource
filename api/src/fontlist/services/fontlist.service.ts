import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Octokit } from '@octokit/rest';

import { Model } from 'mongoose';

import { Fontlist, FontlistDocument } from '../schemas/fontlist.schema';

@Injectable()
export class FontlistService implements OnModuleInit {
  constructor(
    @InjectModel(Fontlist.name)
    private readonly fontlistModel: Model<FontlistDocument>,
  ) {}
  private readonly logger = new Logger(FontlistService.name);

  async getList(): Promise<Record<string, any>> {
    let list = await this.fontlistModel.find().exec();

    // If list empty, force update
    if (list.length === 0) {
      await this.updateList();
      list = await this.fontlistModel.find().exec();
    }

    return list[0].list;
  }

  // Update the fontlist on Nest application startup
  async onModuleInit(): Promise<void> {
    await this.updateList();
  }

  @Cron('0 0 * * *')
  async updateList(): Promise<void> {
    const octokit = new Octokit({
      auth: process.env.GITHUB_PAT,
      userAgent: 'Fontsource API',
    });

    // Cannot update @octokit/rest past 18.0.9 until this issue is resolved - https://github.com/octokit/rest.js/issues/32
    let content;
    await octokit.repos
      .getContent({
        owner: 'fontsource',
        repo: 'fontsource',
        path: '/FONTLIST.json',
      })
      .then(({ data }) => {
        // content will be base64 encoded
        content = JSON.parse(Buffer.from(data.content, 'base64').toString());
      });
    const newList = { list: content };

    // If there is one document in collection as expected, just update.
    const existingDb = await this.fontlistModel.find().exec();
    if (existingDb.length === 1) {
      await this.fontlistModel.updateMany({}, newList);
    } else {
      // If collection does not have 1 document, delete and insert.
      await this.fontlistModel.deleteMany({});

      // Store new document
      const list = new this.fontlistModel(newList);
      await list.save();
    }
    this.logger.log('Updated fontlist');
  }
}
