import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('feed_posts')
export class FeedPost {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    post_type: string;

    @Column({ default: '' })
    date: string;

    @Column('text')
    feed_text: string;

    @Column('simple-array')
    tags: string[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
