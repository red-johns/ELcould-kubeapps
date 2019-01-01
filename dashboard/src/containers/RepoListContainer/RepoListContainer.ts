import { connect } from "react-redux";
import { Action } from "redux";
import { ThunkDispatch } from "redux-thunk";

import actions from "../../actions";
import AppRepoList from "../../components/Config/AppRepoList";
import { IStoreState } from "../../shared/types";

function mapStateToProps({ repos, config }: IStoreState) {
  return {
    errors: repos.errors,
    kubeappsNamespace: config.namespace,
    repos: repos.repos,
  };
}

function mapDispatchToProps(dispatch: ThunkDispatch<IStoreState, null, Action>) {
  return {
    deleteRepo: async (name: string) => {
      return dispatch(actions.repos.deleteRepo(name));
    },
    fetchRepos: async () => {
      return dispatch(actions.repos.fetchRepos());
    },
    install: async (name: string, url: string, authHeader: string, customCA: string) => {
      return dispatch(actions.repos.installRepo(name, url, authHeader, customCA));
    },
    resyncRepo: async (name: string) => {
      return dispatch(actions.repos.resyncRepo(name));
    },
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(AppRepoList);
