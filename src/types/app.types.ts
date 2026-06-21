export type AppRole = 'professor' | 'student' | 'researcher'
export type JobGroup = 'sw_engineering' | 'sw_development' | 'ai_development'
export type ProjectStatus = 'planning' | 'design' | 'implementation' | 'presentation' | 'completed'
export interface Profile { id:string; email:string; name:string; role:AppRole; student_no:string|null; department:string|null; phone:string|null; job_group:JobGroup|null; bio:string|null }
