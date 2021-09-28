import * as core from "@actions/core"
import * as github from "@actions/github"
import {
  append,
  body,
  deleteOldComment,
  githubToken,
  header,
  hideDetails,
  pullRequestNumber,
  recreate,
  repo
} from "./config"
import {
  createComment,
  deleteComment,
  findPreviousComment,
  getBodyOf,
  updateComment
} from "./comment"

async function run(): Promise<undefined> {
  if (isNaN(pullRequestNumber) || pullRequestNumber < 1) {
    core.info("no pull request numbers given: skip step")
    return
  }

  try {
    if (!deleteOldComment && !body) {
      throw new Error("Either message or path input is required")
    }

    if (deleteOldComment && recreate) {
      throw new Error("delete and recreate cannot be both set to true")
    }

    const octokit = github.getOctokit(githubToken)
    const previous = await findPreviousComment(
      octokit,
      repo,
      pullRequestNumber,
      header
    )

    if (!previous) {
      await createComment(octokit, repo, pullRequestNumber, body, header)
      return
    }

    if (deleteOldComment) {
      await deleteComment(octokit, repo, previous.id)
      return
    }

    const previousBody = getBodyOf(previous, append, hideDetails)
    if (recreate) {
      await deleteComment(octokit, repo, previous.id)
      await createComment(
        octokit,
        repo,
        pullRequestNumber,
        body,
        header,
        previousBody
      )
      return
    }

    await updateComment(octokit, repo, previous.id, body, header, previousBody)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
