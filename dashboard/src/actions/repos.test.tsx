import context from "jest-plugin-context";
import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import { getType } from "typesafe-actions";
import actions from ".";
import { AppRepository } from "../shared/AppRepository";
import Secret from "../shared/Secret";
import { IAppRepository, NotFoundError } from "../shared/types";

const { repos: repoActions } = actions;
const mockStore = configureMockStore([thunk]);

let store: any;
const appRepo = { spec: { resyncRequests: 10000 } };

beforeEach(() => {
  store = mockStore({ config: { namespace: "my-namespace" } });
  AppRepository.list = jest.fn().mockImplementationOnce(() => {
    return { items: { foo: "bar" } };
  });
  AppRepository.delete = jest.fn();
  AppRepository.get = jest.fn().mockImplementationOnce(() => {
    return appRepo;
  });
  AppRepository.update = jest.fn();
  AppRepository.create = jest.fn().mockImplementationOnce(() => {
    return { metadata: { name: "repo-abc" } };
  });
  Secret.create = jest.fn();
});

// Regular action creators
interface ITestCase {
  name: string;
  action: (...args: any[]) => any;
  args?: any;
  payload?: any;
}

const repo = { metadata: { name: "my-repo" } } as IAppRepository;

const actionTestCases: ITestCase[] = [
  { name: "addRepo", action: repoActions.addRepo },
  { name: "addedRepo", action: repoActions.addedRepo, args: repo, payload: repo },
  { name: "requestRepos", action: repoActions.requestRepos },
  { name: "receiveRepos", action: repoActions.receiveRepos, args: [[repo]], payload: [repo] },
  { name: "requestRepo", action: repoActions.requestRepo },
  { name: "receiveRepo", action: repoActions.receiveRepo, args: repo, payload: repo },
  { name: "clearRepo", action: repoActions.clearRepo, payload: {} },
  { name: "showForm", action: repoActions.showForm },
  { name: "hideForm", action: repoActions.hideForm },
  { name: "resetForm", action: repoActions.resetForm },
  { name: "submitForm", action: repoActions.submitForm },
  { name: "redirect", action: repoActions.redirect, args: "/foo", payload: "/foo" },
  { name: "redirected", action: repoActions.redirected },
  {
    name: "errorRepos",
    action: repoActions.errorRepos,
    args: [new Error("foo"), "create"],
    payload: { err: new Error("foo"), op: "create" },
  },
];

actionTestCases.forEach(tc => {
  describe(tc.name, () => {
    it("has expected structure", () => {
      const actionResult = tc.action.call(null, ...tc.args);
      expect(actionResult).toEqual({
        type: getType(tc.action),
        payload: tc.payload,
      });
    });
  });
});

// Async action creators
describe("deleteRepo", () => {
  it("dispatches requestRepos and receivedRepos after deletion if no error", async () => {
    const expectedActions = [
      {
        type: getType(repoActions.requestRepos),
      },
      {
        type: getType(repoActions.receiveRepos),
        payload: { foo: "bar" },
      },
    ];

    await store.dispatch(repoActions.deleteRepo("foo"));
    expect(store.getActions()).toEqual(expectedActions);
  });

  it("dispatches errorRepos if error deleting", async () => {
    AppRepository.delete = jest.fn().mockImplementationOnce(() => {
      throw new Error("Boom!");
    });

    const expectedActions = [
      {
        type: getType(repoActions.errorRepos),
        payload: { err: new Error("Boom!"), op: "delete" },
      },
    ];

    await store.dispatch(repoActions.deleteRepo("foo"));
    expect(store.getActions()).toEqual(expectedActions);
  });
});

describe("resyncRepo", () => {
  it("dispatches requestRepos and receiveRepos if no error", async () => {
    const expectedActions = [
      {
        type: getType(repoActions.requestRepos),
      },
      {
        type: getType(repoActions.receiveRepos),
        payload: { foo: "bar" },
      },
    ];

    await store.dispatch(repoActions.resyncRepo("foo"));
    expect(store.getActions()).toEqual(expectedActions);
  });

  it("dispatches errorRepos if error on #get", async () => {
    AppRepository.get = jest.fn().mockImplementationOnce(() => {
      throw new Error("Boom!");
    });

    const expectedActions = [
      {
        type: getType(repoActions.errorRepos),
        payload: { err: new Error("Boom!"), op: "update" },
      },
    ];

    await store.dispatch(repoActions.resyncRepo("foo"));
    expect(store.getActions()).toEqual(expectedActions);
  });

  it("dispatches errorRepos if error on #update", async () => {
    AppRepository.update = jest.fn().mockImplementationOnce(() => {
      throw new Error("Boom!");
    });

    const expectedActions = [
      {
        type: getType(repoActions.errorRepos),
        payload: { err: new Error("Boom!"), op: "update" },
      },
    ];

    await store.dispatch(repoActions.resyncRepo("foo"));
    expect(store.getActions()).toEqual(expectedActions);
  });

  it("dispatches requestRepos and errorRepos if error on #list", async () => {
    AppRepository.list = jest.fn().mockImplementationOnce(() => {
      throw new Error("Boom!");
    });

    const expectedActions = [
      {
        type: getType(repoActions.requestRepos),
      },
      {
        type: getType(repoActions.errorRepos),
        payload: { err: new Error("Boom!"), op: "update" },
      },
    ];

    await store.dispatch(repoActions.resyncRepo("foo"));
    expect(store.getActions()).toEqual(expectedActions);
  });
});

describe("fetchRepos", () => {
  it("dispatches requestRepos and receivedRepos if no error", async () => {
    const expectedActions = [
      {
        type: getType(repoActions.requestRepos),
      },
      {
        type: getType(repoActions.receiveRepos),
        payload: { foo: "bar" },
      },
    ];

    await store.dispatch(repoActions.fetchRepos());
    expect(store.getActions()).toEqual(expectedActions);
  });

  it("dispatches requestRepos and errorRepos if error fetching", async () => {
    AppRepository.list = jest.fn().mockImplementationOnce(() => {
      throw new Error("Boom!");
    });

    const expectedActions = [
      {
        type: getType(repoActions.requestRepos),
      },
      {
        type: getType(repoActions.errorRepos),
        payload: { err: new Error("Boom!"), op: "fetch" },
      },
    ];

    await store.dispatch(repoActions.fetchRepos());
    expect(store.getActions()).toEqual(expectedActions);
  });
});

describe("installRepo", () => {
  const installRepoCMD = repoActions.installRepo("my-repo", "http://foo.bar", "", "");

  context("when authHeader provided", () => {
    const installRepoCMDAuth = repoActions.installRepo(
      "my-repo",
      "http://foo.bar",
      "Bearer: abc",
      "",
    );

    const authStruct = {
      header: { secretKeyRef: { key: "authorizationHeader", name: "apprepo-my-repo-secrets" } },
    };

    it("calls AppRepository create including a auth struct", async () => {
      await store.dispatch(installRepoCMDAuth);
      expect(AppRepository.create).toHaveBeenCalledWith(
        "my-repo",
        "my-namespace",
        "http://foo.bar",
        authStruct,
      );
    });

    it("creates the K8s secret", async () => {
      await store.dispatch(installRepoCMDAuth);
      expect(Secret.create).toHaveBeenCalled();
    });

    it("returns true", async () => {
      const res = await store.dispatch(installRepoCMDAuth);
      expect(res).toBe(true);
    });
  });

  context("when a customCA is provided", () => {
    const installRepoCMDAuth = repoActions.installRepo(
      "my-repo",
      "http://foo.bar",
      "",
      "This is a cert!",
    );

    const authStruct = {
      customCA: { secretKeyRef: { key: "ca.crt", name: "apprepo-my-repo-secrets" } },
    };

    it("calls AppRepository create including a auth struct", async () => {
      await store.dispatch(installRepoCMDAuth);
      expect(AppRepository.create).toHaveBeenCalledWith(
        "my-repo",
        "my-namespace",
        "http://foo.bar",
        authStruct,
      );
    });

    it("creates the K8s secret", async () => {
      await store.dispatch(installRepoCMDAuth);
      expect(Secret.create).toHaveBeenCalled();
    });

    it("returns true", async () => {
      const res = await store.dispatch(installRepoCMDAuth);
      expect(res).toBe(true);
    });
  });

  context("when authHeader and customCA are empty", () => {
    it("calls AppRepository create without a auth struct", async () => {
      await store.dispatch(installRepoCMD);
      expect(AppRepository.create).toHaveBeenCalledWith(
        "my-repo",
        "my-namespace",
        "http://foo.bar",
        {},
      );
    });

    it("does not create a K8s secret", async () => {
      await store.dispatch(installRepoCMD);
      expect(Secret.create).not.toHaveBeenCalled();
    });

    it("returns true", async () => {
      const res = await store.dispatch(installRepoCMD);
      expect(res).toBe(true);
    });
  });

  it("dispatches addRepo and errorRepos if error fetching", async () => {
    AppRepository.create = jest.fn().mockImplementationOnce(() => {
      throw new Error("Boom!");
    });

    const expectedActions = [
      {
        type: getType(repoActions.addRepo),
      },
      {
        type: getType(repoActions.errorRepos),
        payload: { err: new Error("Boom!"), op: "create" },
      },
    ];

    await store.dispatch(installRepoCMD);
    expect(store.getActions()).toEqual(expectedActions);
  });

  it("returns false if error fetching", async () => {
    AppRepository.create = jest.fn().mockImplementationOnce(() => {
      throw new Error("Boom!");
    });

    const res = await store.dispatch(installRepoCMD);
    expect(res).toEqual(false);
  });

  it("dispatches addRepo and addedRepo if no error", async () => {
    const expectedActions = [
      {
        type: getType(repoActions.addRepo),
      },
      {
        type: getType(repoActions.addedRepo),
        payload: { metadata: { name: "repo-abc" } },
      },
    ];

    await store.dispatch(installRepoCMD);
    expect(store.getActions()).toEqual(expectedActions);
  });
});

describe("checkChart", () => {
  window.fetch = jest.fn().mockImplementationOnce(() => {
    return { ok: true };
  });

  it("dispatches requestRepo and receivedRepo if no error", async () => {
    const expectedActions = [
      {
        type: getType(repoActions.requestRepo),
      },
      {
        type: getType(repoActions.receiveRepo),
        payload: appRepo,
      },
    ];

    await store.dispatch(repoActions.checkChart("my-repo", "my-chart"));
    expect(store.getActions()).toEqual(expectedActions);
  });

  it("dispatches requestRepo and errorChart if error fetching", async () => {
    window.fetch = jest.fn().mockImplementationOnce(() => {
      return { ok: false };
    });

    const expectedActions = [
      {
        type: getType(repoActions.requestRepo),
      },
      {
        type: getType(actions.charts.errorChart),
        payload: new NotFoundError("Chart my-chart not found in the repository my-repo."),
      },
    ];

    await store.dispatch(repoActions.checkChart("my-repo", "my-chart"));
    expect(store.getActions()).toEqual(expectedActions);
  });
});
