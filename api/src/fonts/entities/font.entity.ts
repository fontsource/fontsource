import { Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm';
@Entity()
export class Font {
  @ObjectIdColumn()
  id: ObjectID;

  @Column()
  fontId: string;

  @Column()
  fontName: string;

  @Column()
  subsets: string[];

  @Column()
  weights: number[];

  @Column()
  styles: string[];

  @Column()
  defSubset: string;

  @Column()
  variable: boolean;

  @Column()
  lastModified: string;

  @Column()
  version: string;

  @Column()
  category: string;

  @Column()
  source: string;

  @Column()
  license: string;

  @Column()
  type: string;
}

const p = {
  fontId: 'abeezee',
  fontName: 'ABeeZee',
  subsets: ['latin'],
  weights: [400],
  styles: ['italic', 'normal'],
  defSubset: 'latin',
  variable: false,
  lastModified: '2020-09-02',
  version: 'v14',
  category: 'sans-serif',
  source: 'https://fonts.google.com/',
  license: 'https://fonts.google.com/attribution',
  type: 'google',
  objectID: 'abeezee',
};
