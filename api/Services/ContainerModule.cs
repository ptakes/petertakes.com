using System.Reflection;
using Autofac;

namespace Pta.Api.Services
{
    public class ContainerModule : Autofac.Module
    {
        protected override void Load(ContainerBuilder builder)
        {
            var module = GetType().GetTypeInfo();

            builder
              .RegisterAssemblyTypes(module.Assembly)
              .Where(type => type.Namespace == module.Namespace)
              .AsImplementedInterfaces();
        }
    }
}