import { useEffect, useMemo, useState } from "react";
import { useSchool } from "@/contexts/SchoolContext";
import { supabase } from "@/integrations/supabase/client";
import { calculateResults, type CalculatedResult, type ResultSubject, type ScoreEntry } from "@/lib/result-calculations";

type SectionRow = { id:string; name:string; grade_level_id:string };

export function useResultData(){
  const { school, activeYear, years, grades, profile } = useSchool();
  const [yearId,setYearId]=useState(activeYear?.id??"");
  const [gradeId,setGradeId]=useState(""); const [sectionId,setSectionId]=useState("");
  const [period,setPeriod]=useState<"first"|"second"|"final">("first");
  const [sections,setSections]=useState<SectionRow[]>([]); const [subjects,setSubjects]=useState<ResultSubject[]>([]);
  const [allResults,setAllResults]=useState<CalculatedResult[]>([]); const [loading,setLoading]=useState(false);
  useEffect(()=>{if(activeYear?.id&&!years.some(y=>y.id===yearId))setYearId(activeYear.id)},[activeYear?.id,years,yearId]);
  const selectedYear=years.find(y=>y.id===yearId)??activeYear;
  useEffect(()=>{setGradeId("");setSectionId("")},[yearId]);
  const activeGrades=grades.filter(g=>g.academic_year_id===selectedYear?.id);
  const sectionOptions=useMemo(()=>sections.filter(s=>s.grade_level_id===gradeId),[sections,gradeId]);

  useEffect(()=>{void supabase.from("sections").select("id,name,grade_level_id").order("created_at").then(({data})=>setSections(data??[]))},[]);
  useEffect(()=>{
    setSectionId("");setAllResults([]);
    if(!gradeId){setSubjects([]);return}
    void supabase.from("subjects").select("id,name,sort_order").eq("grade_level_id",gradeId).order("sort_order").then(({data})=>setSubjects((data??[]) as ResultSubject[]));
  },[gradeId]);
  useEffect(()=>{
    if(!gradeId||!selectedYear||!school||subjects.length===0){setAllResults([]);return}
    setLoading(true);
    void (async()=>{
      const {data:enrollments,error:e}=await supabase.from("student_enrollments").select("student_id,section_id,students(id,full_name,student_number),sections(name)").eq("academic_year_id",selectedYear.id).eq("grade_level_id",gradeId);
      if(e){setAllResults([]);setLoading(false);return}
      const students=(enrollments??[]).flatMap(row=>{const item=Array.isArray(row.students)?row.students[0]:row.students;const section=Array.isArray(row.sections)?row.sections[0]:row.sections;return item?[{id:item.id,full_name:item.full_name,student_number:Number(item.student_number),section_name:section?.name??""}]:[]});
      if(students.length===0){setAllResults([]);setLoading(false);return}
      let q=supabase.from("scores").select("student_id,subject_id,term,exam_score,coursework_score").eq("academic_year_id",selectedYear.id).in("student_id",students.map(s=>s.id));
      if(period!=="final")q=q.eq("term",period);
      const {data:scores}=await q;
      setAllResults(calculateResults(students,subjects,(scores??[]) as ScoreEntry[],period,school.exam_max+school.coursework_max,school.term_pass_mark));
      setLoading(false);
    })();
  },[gradeId,period,selectedYear?.id,school?.id,school?.exam_max,school?.coursework_max,school?.term_pass_mark,subjects]);

  const [visibleIds,setVisibleIds]=useState<Set<string>>(new Set());
  useEffect(()=>{if(!sectionId||!selectedYear){setVisibleIds(new Set());return}void supabase.from("student_enrollments").select("student_id").eq("academic_year_id",selectedYear.id).eq("section_id",sectionId).then(({data})=>setVisibleIds(new Set((data??[]).map(r=>r.student_id))))},[sectionId,selectedYear?.id]);
  const filteredResults=useMemo(()=>sectionId?allResults.filter(r=>visibleIds.has(r.student.id)):allResults,[allResults,sectionId,visibleIds]);
  return {school,profile,activeYear:selectedYear,years,yearId,setYearId,grades,activeGrades,gradeId,setGradeId,sectionId,setSectionId,period,setPeriod,sections,sectionOptions,subjects,results:filteredResults,allResults,loading};
}
