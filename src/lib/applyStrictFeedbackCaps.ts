import {
  CODE_RUBRIC,
  computeOverallScore,
  INTERVIEW_RUBRIC,
  OPTIMIZATION_RUBRIC,
  scoreToRecommendation,
  weightedSectionScore,
} from '../prompts/interviewer/feedbackRubric'
import type { InterviewFeedbackRequest, InterviewFeedbackResult } from '../types/feedback'
import { analyzeTranscript, type TranscriptSignals } from './feedbackTranscriptAnalysis'

function capCriterion(
  criteria: InterviewFeedbackResult['code']['criteria'],
  id: string,
  maxScore: number,
  note: string,
) {
  const item = criteria.find((c) => c.id === id)
  if (!item || item.score <= maxScore) return
  item.score = maxScore
  if (!item.summary.includes(note)) {
    item.summary = `${item.summary} (${note})`
  }
}

function rebuildSection<T extends InterviewFeedbackResult['code']>(
  section: T,
  rubric: typeof CODE_RUBRIC,
): T {
  return { ...section, score: weightedSectionScore(section.criteria, rubric) }
}

export function applyStrictFeedbackCaps(
  result: InterviewFeedbackResult,
  request: InterviewFeedbackRequest,
  signals: TranscriptSignals = analyzeTranscript(request.transcript),
): InterviewFeedbackResult {
  const { code, interview, optimization } = result

  if (!request.tests.allPassed) {
    capCriterion(code.criteria, 'technical_competency', 2, 'capped: tests not fully passing')
    capCriterion(code.criteria, 'testing', 2, 'capped: incomplete test pass rate')
  }

  if (signals.silentOrMinimalVerbal) {
    capCriterion(interview.criteria, 'communication', 2, 'capped: minimal verbal participation')
    capCriterion(interview.criteria, 'problem_solving', 2, 'capped: no spoken problem-solving evidence')
    capCriterion(interview.criteria, 'answer_relevance', 1, 'capped: no transcript to evaluate relevance')
  }

  if (signals.complexityQuestionAsked && !signals.complexityAnsweredInSpeech) {
    capCriterion(
      optimization.criteria,
      'time_complexity',
      1,
      'capped: interviewer asked for time complexity; candidate did not answer in speech',
    )
    capCriterion(
      optimization.criteria,
      'space_complexity',
      1,
      'capped: no space/time analysis provided when prompted',
    )
    capCriterion(optimization.criteria, 'optimization_tradeoffs', 2, 'capped: missing complexity discussion')
    capCriterion(
      interview.criteria,
      'answer_relevance',
      2,
      'capped: dodged or ignored complexity question',
    )
    capCriterion(interview.criteria, 'communication', 2, 'capped: did not address direct interviewer question')

    optimization.timeComplexity = 'Not answered in interview (interviewer asked; no Big-O in transcript)'
    optimization.spaceComplexity =
      optimization.spaceComplexity === 'Not discussed'
        ? 'Not answered in interview'
        : optimization.spaceComplexity
    optimization.isOptimal = false
  }

  if (signals.complexityDodgedOrOffTopic) {
    capCriterion(interview.criteria, 'answer_relevance', 2, 'capped: off-topic response to technical question')
  }

  if (signals.approachQuestionAsked && !signals.approachAnsweredRelevantly) {
    capCriterion(interview.criteria, 'problem_solving', 2, 'capped: approach question not answered clearly')
    capCriterion(interview.criteria, 'answer_relevance', 2, 'capped: irrelevant or vague approach explanation')
  }

  if (request.session.hintsUsed >= 2) {
    capCriterion(interview.criteria, 'thrives_in_ambiguity', 2, 'capped: heavy hint reliance')
    capCriterion(interview.criteria, 'values_feedback', 2, 'capped: multiple hints required')
  }

  const rebuiltCode = rebuildSection(code, CODE_RUBRIC)
  const rebuiltInterview = rebuildSection(interview, INTERVIEW_RUBRIC)
  const rebuiltOptimization = rebuildSection(optimization, OPTIMIZATION_RUBRIC)

  const overallScore = computeOverallScore({
    code: rebuiltCode.score,
    interview: rebuiltInterview.score,
    optimization: rebuiltOptimization.score,
  })

  let headline = result.headline
  if (signals.complexityQuestionAsked && !signals.complexityAnsweredInSpeech) {
    headline =
      'Working code alone is not enough — you were asked about complexity but did not answer in the interview.'
  } else if (signals.relevanceIssues.length > 0 && overallScore >= 72) {
    headline =
      'Some answers were off-topic or incomplete relative to what the interviewer asked — review verbal sections.'
  }

  return {
    ...result,
    overallScore,
    recommendation: scoreToRecommendation(overallScore),
    headline,
    code: rebuiltCode,
    interview: rebuiltInterview,
    optimization: {
      ...rebuiltOptimization,
      timeComplexity: optimization.timeComplexity,
      spaceComplexity: optimization.spaceComplexity,
      isOptimal: optimization.isOptimal,
      optimizationSummary: optimization.optimizationSummary,
      gradingFlags: {
        complexityQuestionAsked: signals.complexityQuestionAsked,
        complexityAnsweredInSpeech: signals.complexityAnsweredInSpeech,
        complexityDodgedOrOffTopic: signals.complexityDodgedOrOffTopic,
        relevanceIssues: signals.relevanceIssues,
      },
    },
  }
}
