import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('messages')
export class Chat {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    sender: string;

    @Column()
    content: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
