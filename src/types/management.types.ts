export interface Semester { id:string; year:number; term:'spring'|'summer'|'fall'|'winter'; title:string; course_name:string; is_active:boolean }
export interface Participant { id:string; semester_id:string; profile_id:string|null; name:string; department:string|null; student_no:string|null; phone:string|null; email:string; training_job:string|null; company_name:string|null; participation_year:number|null; course_type:string|null; is_registered:boolean }
export interface TeamMember { id:string; profile_id:string; is_leader:boolean; profiles:{name:string;email:string}|null }
export interface Team { id:string; semester_id:string; name:string; topic:string|null; internship_company:string|null; project_name:string|null; status:string; leader_profile_id:string|null; team_members:TeamMember[] }
